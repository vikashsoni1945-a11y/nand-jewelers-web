const SUPABASE_URL = "https://ifmbflibzbocrfmqwgyd.supabase.co";
const SUPABASE_KEY = "sb_publishable_daYW6h5n22EnWXRKqeKQbQ_LYH-NkrB";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function getDateTime(){
  return new Date().toLocaleString("en-IN");
}

function getTodayDate(){
  return new Date().toLocaleDateString("en-IN");
}

async function addCustomer(){
  let name = document.getElementById("name").value;
  let mobile = document.getElementById("mobile").value;
  let balance = Number(document.getElementById("balance").value);

  if(name==="" || mobile==="" || isNaN(balance)){
    alert("Fill all fields");
    return;
  }

  let { error } = await db.from("customers").insert([
    { Name:name, Mobile:mobile, Balance:balance }
  ]);

  if(error){
    alert("Customer Save Error: " + error.message);
    return;
  }

  await db.from("ledger").insert([
    {
      Name:name,
      Mobile:mobile,
      Type:"Opening Balance",
      Amount:balance,
      Balance:balance
    }
  ]);

  alert("Customer Saved in Cloud");
  showCustomers();
}

async function showCustomers(){

  let { data, error } = await db
    .from("customers")
    .select("*");

  if(error){
    alert("List Error: " + error.message);
    return;
  }

  let html = "";

  data.forEach(c=>{
    html += `
    <div class="card">
      Name: ${c.name || c.Name}<br>
      Mobile: ${c.mobile || c.Mobile}<br>
      Balance: ₹${c.balance || c.Balance}
    </div>
    `;
  });

  document.getElementById("customerList").innerHTML = html;
}

async function searchCustomer(){
  let mobile = document.getElementById("searchMobile").value;

  let { data, error } = await db
    .from("customers")
    .select("*")
    .eq("Mobile", mobile)
    .single();

  if(error || !data){
    document.getElementById("searchResult").innerHTML = "Customer Not Found";
    return;
  }

  document.getElementById("searchResult").innerHTML = `
  <div class="card">
    Name: ${data.Name}<br>
    Mobile: ${data.Mobile}<br>
    Balance: ₹${data.Balance}
  </div>
  `;
}

async function receivePayment(){
  let mobile = document.getElementById("payMobile").value;
  let amount = Number(document.getElementById("payAmount").value);

  let { data: customer, error } = await db
    .from("customers")
    .select("*")
    .eq("Mobile", mobile)
    .single();

  if(error || !customer){
    alert("Customer Not Found");
    return;
  }

  let newBalance = Number(customer.Balance) - amount;

  await db
    .from("customers")
    .update({ Balance:newBalance })
    .eq("Mobile", mobile);

  await db.from("ledger").insert([
    {
      Name:customer.Name,
      Mobile:customer.Mobile,
      Type:"Payment Received",
      Amount:amount,
      Balance:newBalance
    }
  ]);

  alert("Payment Saved in Cloud");
  showCustomers();
}

function calculatePurchase(){
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let makingPercent = Number(document.getElementById("making").value);

  let goldValue = weight * rate;
  let makingAmount = (goldValue * makingPercent) / 100;
  let total = goldValue + makingAmount;

  return { goldValue, makingAmount, total };
}

async function goldPurchase(){
  let mobile = document.getElementById("purchaseMobile").value;
  let item = document.getElementById("itemName").value;
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let makingPercent = Number(document.getElementById("making").value);

  let { data: customer, error } = await db
    .from("customers")
    .select("*")
    .eq("Mobile", mobile)
    .single();

  if(error || !customer){
    alert("Customer Not Found");
    return;
  }

  let calc = calculatePurchase();
  let newBalance = Number(customer.Balance) + calc.total;

  await db
    .from("customers")
    .update({ Balance:newBalance })
    .eq("Mobile", mobile);

  await db.from("purchases").insert([
    {
      mobile:customer.Mobile,
      item_name:item,
      weight:weight,
      gold_rate:rate,
      making_percent:makingPercent,
      total_amount:calc.total
    }
  ]);

  await db.from("ledger").insert([
    {
      Name:customer.Name,
      Mobile:customer.Mobile,
      Type:"Gold Purchase - " + item,
      Amount:calc.total,
      Balance:newBalance
    }
  ]);

  alert("Purchase Saved in Cloud");
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
    .eq("Mobile", mobile)
    .single();

  if(error || !customer){
    alert("Customer Not Found");
    return;
  }

  let calc = calculatePurchase();

  document.getElementById("billResult").innerHTML = `
  <div class="bill">
    <h2>NAND JEWELERS</h2>
    <p><b>Date:</b> ${getDateTime()}</p>
    <p><b>Customer:</b> ${customer.Name}</p>
    <p><b>Mobile:</b> ${customer.Mobile}</p>
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
    .eq("Mobile", mobile);

  if(error || data.length===0){
    document.getElementById("statementResult").innerHTML = "No Statement Found";
    return;
  }

  let html = "";

  data.forEach(e=>{
    html += `
    <div class="card">
      Type: ${e.Type}<br>
      Amount: ₹${e.Amount}<br>
      Balance: ₹${e.Balance}
    </div>
    `;
  });

  document.getElementById("statementResult").innerHTML = html;
}

async function dailySalesReport(){
  let { data:purchases } = await db.from("purchases").select("*");
  let { data:ledger } = await db.from("ledger").select("*");

  let totalSales = 0;
  let totalPayments = 0;

  purchases.forEach(p=>{
    totalSales += Number(p.total_amount || 0);
  });

  ledger.forEach(l=>{
    if(l.Type === "Payment Received"){
      totalPayments += Number(l.Amount || 0);
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
