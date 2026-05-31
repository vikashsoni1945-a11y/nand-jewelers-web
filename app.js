const SUPABASE_URL = "https://ifmbflibzbocrfmqwgyd.supabase.co";
const SUPABASE_KEY = "sb_publishable_daYW6h5n22EnWXRKqeKQbQ_LYH-NkrB";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function getDateTime(){
  return new Date().toLocaleString("en-IN");
}

function getISOTime(){
  return new Date().toISOString();
}

async function addCustomer(){
  let name = document.getElementById("name").value;
  let mobile = document.getElementById("mobile").value;
  let balance = Number(document.getElementById("balance").value);

  if(name === "" || mobile === "" || isNaN(balance)){
    alert("Fill all customer fields");
    return;
  }

  let { error } = await db.from("customers").insert([
    {
      Name: name,
      mobile: mobile,
      balance: balance
    }
  ]);

  if(error){
    alert("Customer Save Error: " + error.message);
    return;
  }

  await db.from("ledger").insert([
    {
      name: name,
      mobile: mobile,
      type: "Opening Balance",
      amount: balance,
      balance: balance,
      created_at: getISOTime()
    }
  ]);

  alert("Customer Saved in Cloud");

  document.getElementById("name").value = "";
  document.getElementById("mobile").value = "";
  document.getElementById("balance").value = "";

  showCustomers();
}

async function showCustomers(){
  let { data, error } = await db.from("customers").select("*");

  if(error){
    alert("List Error: " + error.message);
    return;
  }

  let html = "";

  if(!data || data.length === 0){
    html = "<div class='card'>No Customers Found</div>";
  } else {
    data.forEach(c=>{
      html += `
      <div class="card">
        Name: ${c.Name || ""}<br>
        Mobile: ${c.mobile || ""}<br>
        Balance: ₹${c.balance || 0}
      </div>
      `;
    });
  }

  document.getElementById("customerList").innerHTML = html;
}

async function searchCustomer(){
  let mobile = document.getElementById("searchMobile").value;

  let { data, error } = await db
    .from("customers")
    .select("*")
    .eq("mobile", mobile)
    .maybeSingle();

  if(error || !data){
    document.getElementById("searchResult").innerHTML = "Customer Not Found";
    return;
  }

  document.getElementById("searchResult").innerHTML = `
  <div class="card">
    Name: ${data.Name || ""}<br>
    Mobile: ${data.mobile || ""}<br>
    Balance: ₹${data.balance || 0}
  </div>
  `;
}

async function receivePayment(){
  let mobile = document.getElementById("payMobile").value;
  let amount = Number(document.getElementById("payAmount").value);

  if(mobile === "" || isNaN(amount)){
    alert("Fill payment fields");
    return;
  }

  let { data: customer, error } = await db
    .from("customers")
    .select("*")
    .eq("mobile", mobile)
    .maybeSingle();

  if(error || !customer){
    alert("Customer Not Found");
    return;
  }

  let oldBalance = Number(customer.balance || 0);
  let newBalance = oldBalance - amount;

  await db
    .from("customers")
    .update({ balance: newBalance })
    .eq("mobile", mobile);

  await db.from("ledger").insert([
    {
      name: customer.Name || "",
      mobile: mobile,
      type: "Payment Received",
      amount: amount,
      balance: newBalance,
      created_at: getISOTime()
    }
  ]);

  alert("Payment Saved in Cloud");

  document.getElementById("payMobile").value = "";
  document.getElementById("payAmount").value = "";

  showCustomers();
}

function calculatePurchase(){
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let makingPercent = Number(document.getElementById("making").value);

  let goldValue = weight * rate;
  let makingAmount = (goldValue * makingPercent) / 100;
  let total = goldValue + makingAmount;

  return {
    goldValue: goldValue,
    makingAmount: makingAmount,
    total: total
  };
}

async function goldPurchase(){
  let mobile = document.getElementById("purchaseMobile").value;
  let item = document.getElementById("itemName").value;
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let makingPercent = Number(document.getElementById("making").value);

  if(mobile === "" || item === "" || isNaN(weight) || isNaN(rate) || isNaN(makingPercent)){
    alert("Fill purchase fields");
    return;
  }

  let { data: customer, error } = await db
    .from("customers")
    .select("*")
    .eq("mobile", mobile)
    .maybeSingle();

  if(error || !customer){
    alert("Customer Not Found");
    return;
  }

  let calc = calculatePurchase();
  let oldBalance = Number(customer.balance || 0);
  let newBalance = oldBalance + calc.total;

  await db
    .from("customers")
    .update({ balance: newBalance })
    .eq("mobile", mobile);

  await db.from("purchases").insert([
    {
      mobile: mobile,
      item_name: item,
      weight: weight,
      gold_rate: rate,
      making_percent: makingPercent,
      total_amount: calc.total,
      created_at: getISOTime()
    }
  ]);

  await db.from("ledger").insert([
    {
      name: customer.Name || "",
      mobile: mobile,
      type: "Gold Purchase - " + item,
      amount: calc.total,
      balance: newBalance,
      created_at: getISOTime()
    }
  ]);

  alert(
    "Purchase Saved in Cloud\n" +
    "Gold Value: ₹" + calc.goldValue + "\n" +
    "Making: ₹" + calc.makingAmount + "\n" +
    "Total: ₹" + calc.total
  );

  showCustomers();
}

async function generateBill(){
  let mobile = document.getElementById("purchaseMobile").value;
  let item = document.getElementById("itemName").value;
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let makingPercent = Number(document.getElementById("making").value);

  let { data: customer, error } = await db
    .from("customers")
    .select("*")
    .eq("mobile", mobile)
    .maybeSingle();

  if(error || !customer){
    alert("Customer Not Found");
    return;
  }

  let calc = calculatePurchase();

  document.getElementById("billResult").innerHTML = `
  <div class="bill">
    <h2>NAND JEWELERS</h2>
    <p><b>Date:</b> ${getDateTime()}</p>
    <p><b>Customer:</b> ${customer.Name || ""}</p>
    <p><b>Mobile:</b> ${mobile}</p>
    <hr>
    <p><b>Item:</b> ${item}</p>
    <p><b>Weight:</b> ${weight} gm</p>
    <p><b>Gold Rate:</b> ₹${rate}</p>
    <p><b>Gold Value:</b> ₹${calc.goldValue}</p>
    <p><b>Making (${makingPercent}%):</b> ₹${calc.makingAmount}</p>
    <hr>
    <h3>Total Bill: ₹${calc.total}</h3>
    <p>Thank you for shopping!</p>
  </div>
  `;
}

async function showStatement(){

  let mobile = document.getElementById("statementMobile").value;

  let { data, error } = await db
    .from("ledger")
    .select("*")
    .eq("mobile", mobile)
    .order("created_at", { ascending: true });

  if(error || !data || data.length === 0){
    document.getElementById("statementResult").innerHTML =
    "No Statement Found";
    return;
  }

  let html = "";

  data.forEach(e=>{

    html += `
    <div class="card">
      Date & Time: ${e.created_at || ""}<br>
      Type: ${e.type || ""}<br>
      Amount: ₹${e.amount || 0}<br>
      Balance: ₹${e.balance || 0}
    </div>
    `;
  });

  document.getElementById("statementResult").innerHTML = html;
}

async function dailySalesReport(){
  let { data: purchases } = await db.from("purchases").select("*");
  let { data: ledger } = await db.from("ledger").select("*");

  let totalSales = 0;
  let totalPayments = 0;

  (purchases || []).forEach(p=>{
    totalSales += Number(p.total_amount || 0);
  });

  (ledger || []).forEach(l=>{
    if(l.type === "Payment Received"){
      totalPayments += Number(l.amount || 0);
    }
  });

  document.getElementById("dailyReport").innerHTML = `
  <div class="card">
    <b>Total Sales:</b> ₹${totalSales}<br>
    <b>Total Payment Received:</b> ₹${totalPayments}
  </div>
  `;
}

showCustomers();
