const SUPABASE_URL = "https://ifmbflibzbocrfmqwgyd.supabase.co";
const SUPABASE_KEY = "sb_publishable_daYW6h5n22EnWXRKqeKQbQ_LYH-NkrB";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function money(v){
  return "₹" + Number(v || 0).toFixed(2);
}

function nowISO(){
  return new Date().toISOString();
}

function dateTime(v){
  if(!v) return "";
  return new Date(v).toLocaleString("en-IN");
}

async function findCustomer(input){
  input = (input || "").trim().toLowerCase();
  if(!input) return null;

  let { data, error } = await db.from("customers").select("*");
  if(error || !data) return null;

  return data.find(c =>
    String(c.mobile || "").toLowerCase() === input ||
    String(c.Name || "").toLowerCase() === input
  );
}

async function addLedger(customer, type, amount, balance){
  await db.from("ledger").insert([{
    name: customer.Name || customer.name || "",
    mobile: customer.mobile || "",
    type: type,
    amount: Number(amount || 0),
    balance: Number(balance || 0),
    created_at: nowISO()
  }]);
}

async function updateDashboard(){
  let { data: customers } = await db.from("customers").select("*");
  let { data: ledger } = await db.from("ledger").select("*");
  let { data: expenses } = await db.from("expenses").select("*");

  let totalCustomers = (customers || []).length;
  let pending = 0;
  let advance = 0;
  let payments = 0;
  let expenseTotal = 0;

  (customers || []).forEach(c=>{
    let b = Number(c.balance || 0);
    if(b > 0) pending += b;
    if(b < 0) advance += Math.abs(b);
  });

  (ledger || []).forEach(l=>{
    if((l.type || "").includes("Payment") || (l.type || "").includes("Deposit")){
      payments += Number(l.amount || 0);
    }
  });

  (expenses || []).forEach(e=>{
    expenseTotal += Number(e.amount || 0);
  });

  document.getElementById("totalCustomers").innerText = totalCustomers;
  document.getElementById("pendingAmount").innerText = money(pending);
  document.getElementById("advanceAmount").innerText = money(advance);
  document.getElementById("cashInHand").innerText = money(payments - expenseTotal);
  document.getElementById("totalExpense").innerText = money(expenseTotal);
}

async function addCustomer(){
  let name = document.getElementById("name").value.trim();
  let father = document.getElementById("fatherName").value.trim();
  let city = document.getElementById("city").value.trim();
  let mobile = document.getElementById("mobile").value.trim();
  let balance = Number(document.getElementById("balance").value);

  if(!name || isNaN(balance)){
    alert("Name और Opening Balance जरूरी है");
    return;
  }

  let { error } = await db.from("customers").insert([{
    Name: name,
    father_name: father,
    city: city,
    mobile: mobile,
    balance: balance,
    created_at: nowISO()
  }]);

  if(error){
    alert("Customer Error: " + error.message);
    return;
  }

  await addLedger({Name:name,mobile:mobile},"Opening Balance",balance,balance);

  alert("Customer Saved");
  document.getElementById("name").value="";
  document.getElementById("fatherName").value="";
  document.getElementById("city").value="";
  document.getElementById("mobile").value="";
  document.getElementById("balance").value="";

  showCustomers();
  updateDashboard();
}

async function showCustomers(){
  let { data, error } = await db.from("customers").select("*").order("created_at",{ascending:false});

  if(error){
    alert(error.message);
    return;
  }

  let html = "";
  (data || []).forEach(c=>{
    html += `
    <div class="card">
      <b>${c.Name || ""}</b><br>
      Father: ${c.father_name || ""}<br>
      City: ${c.city || ""}<br>
      Mobile: ${c.mobile || "No Mobile"}<br>
      Balance: ${money(c.balance)}
    </div>`;
  });

  document.getElementById("customerList").innerHTML = html || "No Customers Found";
}

async function searchCustomer(){
  let input = document.getElementById("searchText").value;
  let c = await findCustomer(input);

  if(!c){
    document.getElementById("searchResult").innerHTML = "Customer Not Found";
    return;
  }

  document.getElementById("searchResult").innerHTML = `
  <div class="card">
    <b>Name:</b> ${c.Name}<br>
    <b>Father:</b> ${c.father_name || ""}<br>
    <b>City:</b> ${c.city || ""}<br>
    <b>Mobile:</b> ${c.mobile || "No Mobile"}<br>
    <b>Balance:</b> ${money(c.balance)}
  </div>`;
}

async function receivePayment(){
  let input = document.getElementById("payCustomer").value;
  let amount = Number(document.getElementById("payAmount").value);
  let c = await findCustomer(input);

  if(!c || isNaN(amount)){
    alert("Customer या Amount गलत है");
    return;
  }

  let newBalance = Number(c.balance || 0) - amount;

  await db.from("customers").update({balance:newBalance}).eq("id",c.id);
  await addLedger(c,"Payment Received",amount,newBalance);

  alert("Payment Saved");
  document.getElementById("payCustomer").value="";
  document.getElementById("payAmount").value="";
  showCustomers();
  updateDashboard();
}

async function saveDeposit(){
  let input = document.getElementById("depositCustomer").value;
  let type = document.getElementById("depositType").value;
  let weight = Number(document.getElementById("depositWeight").value || 0);
  let purity = document.getElementById("depositPurity").value;
  let value = Number(document.getElementById("depositValue").value);
  let note = document.getElementById("depositNote").value;

  let c = await findCustomer(input);

  if(!c || isNaN(value)){
    alert("Customer या Value गलत है");
    return;
  }

  let newBalance = Number(c.balance || 0) - value;

  await db.from("deposits").insert([{
    name: c.Name,
    mobile: c.mobile || "",
    deposit_type: type,
    weight: weight,
    purity: purity,
    value: value,
    note: note,
    created_at: nowISO()
  }]);

  await db.from("customers").update({balance:newBalance}).eq("id",c.id);

  let ledgerType = `${type} | Weight: ${weight || "-"} | Purity: ${purity || "-"} | Note: ${note || "-"}`;
  await addLedger(c,ledgerType,value,newBalance);

  alert("Deposit Saved");
  document.getElementById("depositCustomer").value="";
  document.getElementById("depositWeight").value="";
  document.getElementById("depositPurity").value="";
  document.getElementById("depositValue").value="";
  document.getElementById("depositNote").value="";
  showCustomers();
  updateDashboard();
}

function calcPurchase(){
  let w = Number(document.getElementById("weight").value);
  let r = Number(document.getElementById("rate").value);
  let m = Number(document.getElementById("making").value);
  let goldValue = w * r;
  let total = goldValue + (goldValue * m / 100);
  return {goldValue,total};
}

async function goldPurchase(){
  let input = document.getElementById("purchaseCustomer").value;
  let item = document.getElementById("itemName").value;
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let making = Number(document.getElementById("making").value);

  let c = await findCustomer(input);

  if(!c || !item || isNaN(weight) || isNaN(rate) || isNaN(making)){
    alert("Purchase details गलत हैं");
    return;
  }

  let calc = calcPurchase();
  let newBalance = Number(c.balance || 0) + calc.total;

  await db.from("purchases").insert([{
    mobile: c.mobile || "",
    item_name: item,
    weight: weight,
    gold_rate: rate,
    making_percent: making,
    total_amount: calc.total,
    created_at: nowISO()
  }]);

  await db.from("customers").update({balance:newBalance}).eq("id",c.id);
  await addLedger(c,"Gold Purchase - " + item,calc.total,newBalance);

  alert("Purchase Saved");
  showCustomers();
  updateDashboard();
}

async function generateBill(){
  let input = document.getElementById("purchaseCustomer").value;
  let item = document.getElementById("itemName").value;
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let making = Number(document.getElementById("making").value);
  let c = await findCustomer(input);

  if(!c){
    alert("Customer Not Found");
    return;
  }

  let calc = calcPurchase();

  document.getElementById("billResult").innerHTML = `
  <div class="bill">
    <h2>NAND JEWELERS</h2>
    Date: ${new Date().toLocaleString("en-IN")}<br>
    Customer: ${c.Name}<br>
    Father: ${c.father_name || ""}<br>
    City: ${c.city || ""}<br>
    Mobile: ${c.mobile || "No Mobile"}<hr>
    Item: ${item}<br>
    Weight: ${weight} gm<br>
    Rate: ${money(rate)}<br>
    Making: ${making}%<hr>
    <h3>Total: ${money(calc.total)}</h3>
  </div>`;
}

async function addExpense(){
  let category = document.getElementById("expenseCategory").value;
  let description = document.getElementById("expenseDescription").value;
  let amount = Number(document.getElementById("expenseAmount").value);

  if(isNaN(amount)){
    alert("Amount गलत है");
    return;
  }

  let { error } = await db.from("expenses").insert([{
    category:category,
    description:description,
    amount:amount,
    created_at:nowISO()
  }]);

  if(error){
    alert("Expense Error: " + error.message);
    return;
  }

  alert("Expense Saved");
  document.getElementById("expenseDescription").value="";
  document.getElementById("expenseAmount").value="";
  updateDashboard();
}

async function showStatement(){
  let input = document.getElementById("statementCustomer").value;
  let c = await findCustomer(input);

  if(!c){
    document.getElementById("statementResult").innerHTML = "Customer Not Found";
    return;
  }

  let { data } = await db.from("ledger").select("*")
    .or(`mobile.eq.${c.mobile},name.eq.${c.Name}`)
    .order("created_at",{ascending:true});

  let html = `
  <div class="card">
    <h3>Statement</h3>
    Name: ${c.Name}<br>
    Father: ${c.father_name || ""}<br>
    City: ${c.city || ""}<br>
    Mobile: ${c.mobile || "No Mobile"}<br>
    Current Balance: ${money(c.balance)}
  </div>`;

  (data || []).forEach(e=>{
    html += `
    <div class="card">
      <b>Date & Time:</b> ${dateTime(e.created_at)}<br>
      <b>Particular:</b> ${e.type}<br>
      <b>Amount:</b> ${money(e.amount)}<br>
      <b>Balance:</b> ${money(e.balance)}
    </div>`;
  });

  document.getElementById("statementResult").innerHTML = html;
}

async function pendingReport(){
  let { data } = await db.from("customers").select("*");
  let html = "<h3>Pending Customers</h3>";
  let total = 0;

  (data || []).forEach(c=>{
    let b = Number(c.balance || 0);
    if(b > 0){
      total += b;
      html += `<div class="card">${c.Name} | ${c.mobile || "No Mobile"} | Pending: ${money(b)}</div>`;
    }
  });

  html += `<div class="card"><b>Total Pending: ${money(total)}</b></div>`;
  document.getElementById("pendingReport").innerHTML = html;
}

async function advanceReport(){
  let { data } = await db.from("customers").select("*");
  let html = "<h3>Advance Customers</h3>";
  let total = 0;

  (data || []).forEach(c=>{
    let b = Number(c.balance || 0);
    if(b < 0){
      total += Math.abs(b);
      html += `<div class="card">${c.Name} | ${c.mobile || "No Mobile"} | Advance: ${money(Math.abs(b))}</div>`;
    }
  });

  html += `<div class="card"><b>Total Advance: ${money(total)}</b></div>`;
  document.getElementById("advanceReport").innerHTML = html;
}

async function cashBook(){
  let { data: ledger } = await db.from("ledger").select("*");
  let { data: expenses } = await db.from("expenses").select("*");

  let income = 0, expense = 0;
  let html = "<h3>Cash Book</h3>";

  (ledger || []).forEach(l=>{
    if((l.type || "").includes("Payment") || (l.type || "").includes("Deposit")){
      income += Number(l.amount || 0);
      html += `<div class="card">IN | ${dateTime(l.created_at)} | ${l.type} | ${money(l.amount)}</div>`;
    }
  });

  (expenses || []).forEach(e=>{
    expense += Number(e.amount || 0);
    html += `<div class="card">OUT | ${dateTime(e.created_at)} | ${e.category} | ${e.description || ""} | ${money(e.amount)}</div>`;
  });

  html += `<div class="card"><b>Cash In Hand: ${money(income - expense)}</b></div>`;
  document.getElementById("cashBookResult").innerHTML = html;
}

showCustomers();
updateDashboard();
