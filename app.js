const SUPABASE_URL = "https://ifmbflibzbocrfmqwgyd.supabase.co";
const SUPABASE_KEY = "sb_publishable_daYW6h5n22EnWXRKqeKQbQ_LYH-NkrB";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function formatMoney(amount){
  return "₹" + Number(amount || 0).toFixed(2);
}

function formatDate(dateValue){
  if(!dateValue) return "";
  return new Date(dateValue).toLocaleString("en-IN");
}

function getISOTime(){
  return new Date().toISOString();
}

async function addLedger(name, mobile, type, amount, balance){
  await db.from("ledger").insert([{
    name: name,
    mobile: mobile,
    type: type,
    amount: amount,
    balance: balance,
    created_at: getISOTime()
  }]);
}

async function addCustomer(){
  let name = document.getElementById("name").value.trim();
  let fatherName = document.getElementById("fatherName").value.trim();
  let city = document.getElementById("city").value.trim();
  let mobile = document.getElementById("mobile").value.trim();
  let balance = Number(document.getElementById("balance").value);

  if(name === "" || isNaN(balance)){
    alert("Customer Name और Opening Balance जरूरी है");
    return;
  }

  let { error } = await db.from("customers").insert([{
    Name: name,
    father_name: fatherName,
    city: city,
    mobile: mobile,
    balance: balance
  }]);

  if(error){
    alert("Customer Save Error: " + error.message);
    return;
  }

  await addLedger(name, mobile, "Opening Balance", balance, balance);

  alert("Customer Saved");

  document.getElementById("name").value = "";
  document.getElementById("fatherName").value = "";
  document.getElementById("city").value = "";
  document.getElementById("mobile").value = "";
  document.getElementById("balance").value = "";

  await showCustomers();
  await updateDashboard();
}

async function showCustomers(){
  let { data, error } = await db.from("customers").select("*").order("created_at", { ascending:false });

  if(error){
    alert("List Error: " + error.message);
    return;
  }

  let html = "";

  if(!data || data.length === 0){
    html = "<div class='card'>No Customers Found</div>";
  }else{
    data.forEach(c=>{
      html += `
      <div class="card">
        <b>Name:</b> ${c.Name || ""}<br>
        <b>Father:</b> ${c.father_name || ""}<br>
        <b>City:</b> ${c.city || ""}<br>
        <b>Mobile:</b> ${c.mobile || "No Mobile"}<br>
        <b>Balance:</b> ${formatMoney(c.balance)}
      </div>
      `;
    });
  }

  document.getElementById("customerList").innerHTML = html;
}

async function findCustomerByInput(input){
  let { data, error } = await db.from("customers").select("*");

  if(error || !data) return null;

  input = input.trim().toLowerCase();

  return data.find(c =>
    (c.mobile || "").toLowerCase() === input ||
    (c.Name || "").toLowerCase() === input
  );
}

async function searchCustomer(){
  let searchText = document.getElementById("searchText").value.trim();

  if(searchText === ""){
    alert("Name या Mobile डालो");
    return;
  }

  let customer = await findCustomerByInput(searchText);

  if(!customer){
    document.getElementById("searchResult").innerHTML = "Customer Not Found";
    return;
  }

  document.getElementById("searchResult").innerHTML = `
  <div class="card">
    <b>Customer Found</b><br><br>
    <b>Name:</b> ${customer.Name || ""}<br>
    <b>Father:</b> ${customer.father_name || ""}<br>
    <b>City:</b> ${customer.city || ""}<br>
    <b>Mobile:</b> ${customer.mobile || "No Mobile"}<br>
    <b>Balance:</b> ${formatMoney(customer.balance)}
  </div>
  `;
}

async function receivePayment(){
  let input = document.getElementById("payMobile").value.trim();
  let amount = Number(document.getElementById("payAmount").value);

  if(input === "" || isNaN(amount)){
    alert("Customer Name/Mobile और Amount भरो");
    return;
  }

  let customer = await findCustomerByInput(input);

  if(!customer){
    alert("Customer Not Found");
    return;
  }

  let newBalance = Number(customer.balance || 0) - amount;

  let { error } = await db.from("customers")
    .update({ balance: newBalance })
    .eq("id", customer.id);

  if(error){
    alert("Payment Error: " + error.message);
    return;
  }

  await addLedger(customer.Name || "", customer.mobile || "", "Payment Received", amount, newBalance);

  alert("Payment Saved");

  document.getElementById("payMobile").value = "";
  document.getElementById("payAmount").value = "";

  await showCustomers();
  await updateDashboard();
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
  let input = document.getElementById("purchaseMobile").value.trim();
  let item = document.getElementById("itemName").value.trim();
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let makingPercent = Number(document.getElementById("making").value);

  if(input === "" || item === "" || isNaN(weight) || isNaN(rate) || isNaN(makingPercent)){
    alert("Purchase fields पूरे भरो");
    return;
  }

  let customer = await findCustomerByInput(input);

  if(!customer){
    alert("Customer Not Found");
    return;
  }

  let calc = calculatePurchase();
  let newBalance = Number(customer.balance || 0) + calc.total;

  await db.from("customers")
    .update({ balance: newBalance })
    .eq("id", customer.id);

  await db.from("purchases").insert([{
    mobile: customer.mobile || "",
    item_name: item,
    weight: weight,
    gold_rate: rate,
    making_percent: makingPercent,
    total_amount: calc.total,
    created_at: getISOTime()
  }]);

  await addLedger(customer.Name || "", customer.mobile || "", "Gold Purchase - " + item, calc.total, newBalance);

  alert("Purchase Saved");

  await showCustomers();
  await updateDashboard();
}

async function generateBill(){
  let input = document.getElementById("purchaseMobile").value.trim();
  let item = document.getElementById("itemName").value.trim();
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let makingPercent = Number(document.getElementById("making").value);

  let customer = await findCustomerByInput(input);

  if(!customer){
    alert("Customer Not Found");
    return;
  }

  let calc = calculatePurchase();

  document.getElementById("billResult").innerHTML = `
  <div class="card">
    <h2>NAND JEWELERS</h2>
    <b>Date:</b> ${new Date().toLocaleString("en-IN")}<br>
    <b>Customer:</b> ${customer.Name || ""}<br>
    <b>Father:</b> ${customer.father_name || ""}<br>
    <b>City:</b> ${customer.city || ""}<br>
    <b>Mobile:</b> ${customer.mobile || "No Mobile"}<hr>
    <b>Item:</b> ${item}<br>
    <b>Weight:</b> ${weight} gm<br>
    <b>Gold Rate:</b> ${formatMoney(rate)}<br>
    <b>Making:</b> ${makingPercent}%<br>
    <hr>
    <h3>Total Bill: ${formatMoney(calc.total)}</h3>
  </div>
  `;
}

async function addExpense(){
  let category = document.getElementById("expenseCategory").value;
  let description = document.getElementById("expenseDescription").value.trim();
  let amount = Number(document.getElementById("expenseAmount").value);

  if(isNaN(amount) || amount <= 0){
    alert("Expense amount भरो");
    return;
  }

  let { error } = await db.from("expenses").insert([{
    category: category,
    description: description,
    amount: amount,
    created_at: getISOTime()
  }]);

  if(error){
    alert("Expense Error: " + error.message);
    return;
  }

  alert("Expense Saved");

  document.getElementById("expenseDescription").value = "";
  document.getElementById("expenseAmount").value = "";

  await updateDashboard();
}

async function showStatement(){
  let input = document.getElementById("statementMobile").value.trim();

  let customer = await findCustomerByInput(input);

  if(!customer){
    document.getElementById("statementResult").innerHTML = "Customer Not Found";
    return;
  }

  let { data, error } = await db.from("ledger")
    .select("*")
    .or(`mobile.eq.${customer.mobile},name.eq.${customer.Name}`)
    .order("created_at", { ascending:true });

  if(error || !data || data.length === 0){
    document.getElementById("statementResult").innerHTML = "No Statement Found";
    return;
  }

  let html = `
  <div class="card">
    <h3>Statement</h3>
    <b>Name:</b> ${customer.Name || ""}<br>
    <b>Father:</b> ${customer.father_name || ""}<br>
    <b>City:</b> ${customer.city || ""}<br>
    <b>Mobile:</b> ${customer.mobile || "No Mobile"}<br>
    <b>Current Balance:</b> ${formatMoney(customer.balance)}
  </div>
  `;

  data.forEach(e=>{
    html += `
    <div class="card">
      <b>Date & Time:</b> ${formatDate(e.created_at)}<br>
      <b>Particular:</b> ${e.type || ""}<br>
      <b>Amount:</b> ${formatMoney(e.amount)}<br>
      <b>Balance:</b> ${formatMoney(e.balance)}
    </div>
    `;
  });

  document.getElementById("statementResult").innerHTML = html;
}

async function updateDashboard(){
  let { data: customers } = await db.from("customers").select("*");
  let { data: ledger } = await db.from("ledger").select("*");
  let { data: expenses } = await db.from("expenses").select("*");

  let totalCustomers = (customers || []).length;
  let pending = 0;
  let advance = 0;
  let totalPayments = 0;
  let totalExpenses = 0;

  (customers || []).forEach(c=>{
    let bal = Number(c.balance || 0);
    if(bal > 0) pending += bal;
    if(bal < 0) advance += Math.abs(bal);
  });

  (ledger || []).forEach(l=>{
    if(l.type === "Payment Received"){
      totalPayments += Number(l.amount || 0);
    }
  });

  (expenses || []).forEach(e=>{
    totalExpenses += Number(e.amount || 0);
  });

  let cashInHand = totalPayments - totalExpenses;

  document.getElementById("totalCustomers").innerText = totalCustomers;
  document.getElementById("pendingAmount").innerText = formatMoney(pending);
  document.getElementById("advanceAmount").innerText = formatMoney(advance);
  document.getElementById("cashInHand").innerText = formatMoney(cashInHand);
}

showCustomers();
updateDashboard();
