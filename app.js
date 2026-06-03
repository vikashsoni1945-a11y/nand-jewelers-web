
const SUPABASE_URL = "https://ifmbflibzbocrfmqwgyd.supabase.co";
const SUPABASE_KEY = "sb_publishable_daYW6h5n22EnWXRKqeKQbQ_LYH-NkrB";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let loadedEditCustomer = null;
let lastStatementData = null;
let lastStatementCustomer = null;

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

  if(!input){
    return null;
  }

  let { data, error } = await db
    .from("customers")
    .select("*");

  if(error || !data){
    return null;
  }

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
  let totalCollection = 0;
  let totalExpense = 0;

  (customers || []).forEach(c=>{
    let bal = Number(c.balance || 0);

    if(bal > 0){
      pending += bal;
    }

    if(bal < 0){
      advance += Math.abs(bal);
    }
  });

  (ledger || []).forEach(l=>{
    let type = l.type || "";

    if(type.includes("Payment") || type.includes("Deposit")){
      totalCollection += Number(l.amount || 0);
    }
  });

  (expenses || []).forEach(e=>{
    totalExpense += Number(e.amount || 0);
  });

  document.getElementById("totalCustomers").innerText = totalCustomers;
  document.getElementById("pendingAmount").innerText = money(pending);
  document.getElementById("advanceAmount").innerText = money(advance);
  document.getElementById("cashInHand").innerText = money(totalCollection - totalExpense);
  document.getElementById("totalExpense").innerText = money(totalExpense);
let todayCollection = 0;

let today = new Date().toDateString();

(ledger || []).forEach(l=>{

  let type = l.type || "";

  let date = new Date(
    l.created_at
  ).toDateString();

  if(
    date === today &&
    type.includes("Payment")
  ){
    todayCollection +=
      Number(l.amount || 0);
  }
});

document.getElementById(
  "todayCollection"
).innerText =
money(todayCollection);
let todaySale = 0;

let today2 = new Date().toDateString();

(ledger || []).forEach(l=>{

  let type = l.type || "";

  let date = new Date(
    l.created_at
  ).toDateString();

  if(
    date === today2 &&
    (
      type.includes("Purchase") ||
      type.includes("Bill")
    )
  ){
    todaySale +=
      Number(l.amount || 0);
  }
});

document.getElementById(
  "todaySale"
).innerText =
money(todaySale);
let todayDeposit = 0;

let today3 = new Date().toDateString();

(deposits || []).forEach(d=>{

  let date = new Date(
    d.created_at
  ).toDateString();

  if(date === today3){
    todayDeposit +=
      Number(d.value || 0);
  }
});

document.getElementById(
  "todayDeposit"
).innerText =
money(todayDeposit);
let todayExpense = 0;

let today4 = new Date().toDateString();

(expenses || []).forEach(e=>{

  let date = new Date(
    e.created_at
  ).toDateString();

  if(date === today4){
    todayExpense +=
      Number(e.amount || 0);
  }
});

document.getElementById(
  "todayExpense"
).innerText =
money(todayExpense);
// Profit Dashboard

let totalSales = 0;

(purchases || []).forEach(p=>{
  totalSales += Number(p.total_amount || p.total || 0)
});

document.getElementById(
  "totalSales"
).innerText =
money(totalSales);


let monthlySales = 0;

let currentMonth =
new Date().getMonth();

(purchases || []).forEach(p=>{

  let d = new Date(
    p.created_at
  );

  if(
    d.getMonth() === currentMonth
  ){
    monthlySales +=
      Number(p.total_amount || p.total || 0)
  }
});

document.getElementById(
  "monthlySales"
).innerText =
money(monthlySales);


let todayProfit =
todaySale - todayExpense;

document.getElementById(
  "todayProfit"
).innerText =
money(todayProfit);


let monthlyProfit =
monthlySales - totalExpense;

document.getElementById(
  "monthlyProfit"
).innerText =
money(monthlyProfit);
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

  await addLedger(
    {Name:name, mobile:mobile},
    "Opening Balance",
    balance,
    balance
  );

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
  let { data, error } = await db
    .from("customers")
    .select("*")
    .order("created_at", {ascending:false});

  if(error){
    alert("Customer List Error: " + error.message);
    return;
  }

  let html = "";

  if(!data || data.length === 0){
    html = "No Customers Found";
  }

  (data || []).forEach(c=>{
    html += `
    <div class="card">
      <b>${c.Name || ""}</b><br>
      Father: ${c.father_name || ""}<br>
      City: ${c.city || ""}<br>
      Mobile: ${c.mobile || "No Mobile"}<br>
      Balance: ${money(c.balance)}
    </div>
    `;
  });

  document.getElementById("customerList").innerHTML = html;
}

async function searchCustomer(){
  let input = document.getElementById("searchText").value;
  let c = await findCustomer(input);

  if(!c){
    document.getElementById("searchResult").innerHTML =
    "Customer Not Found";
    return;
  }

  document.getElementById("searchResult").innerHTML = `
  <div class="card">
    <b>Name:</b> ${c.Name || ""}<br>
    <b>Father:</b> ${c.father_name || ""}<br>
    <b>City:</b> ${c.city || ""}<br>
    <b>Mobile:</b> ${c.mobile || "No Mobile"}<br>
    <b>Balance:</b> ${money(c.balance)}
  </div>
  `;
}

async function loadCustomerForEdit(){
  let input = document.getElementById("editCustomerSearch").value;
  let c = await findCustomer(input);

  if(!c){
    document.getElementById("editResult").innerHTML =
    "Customer Not Found";
    return;
  }

  loadedEditCustomer = c;

  document.getElementById("editName").value = c.Name || "";
  document.getElementById("editFather").value = c.father_name || "";
  document.getElementById("editCity").value = c.city || "";
  document.getElementById("editMobile").value = c.mobile || "";
  document.getElementById("editBalance").value = c.balance || 0;

  document.getElementById("editResult").innerHTML =
  "Customer Loaded";
}

async function updateCustomer(){
  if(!loadedEditCustomer){
    alert("पहले customer load करो");
    return;
  }

  let newName = document.getElementById("editName").value.trim();
  let newFather = document.getElementById("editFather").value.trim();
  let newCity = document.getElementById("editCity").value.trim();
  let newMobile = document.getElementById("editMobile").value.trim();
  let newBalance = Number(document.getElementById("editBalance").value);

  let { error } = await db
    .from("customers")
    .update({
      Name: newName,
      father_name: newFather,
      city: newCity,
      mobile: newMobile,
      balance: newBalance
    })
    .eq("id", loadedEditCustomer.id);

  if(error){
    alert("Update Error: " + error.message);
    return;
  }

  alert("Customer Updated");

  loadedEditCustomer = null;

  document.getElementById("editCustomerSearch").value = "";
  document.getElementById("editName").value = "";
  document.getElementById("editFather").value = "";
  document.getElementById("editCity").value = "";
  document.getElementById("editMobile").value = "";
  document.getElementById("editBalance").value = "";
  document.getElementById("editResult").innerHTML = "";

  await showCustomers();
  await updateDashboard();
}

  async function deleteCustomer(){
  if(!loadedEditCustomer){
    alert("पहले customer load करो");
    return;
  }

  let confirmDelete = confirm(
    "क्या आप सच में इस customer को delete करना चाहते हैं?"
  );

  if(!confirmDelete){
    return;
  }

  let { error } = await db
    .from("customers")
    .delete()
    .eq("id", loadedEditCustomer.id);

  if(error){
    alert("Delete Error: " + error.message);
    return;
  }

  alert("Customer Deleted");

  loadedEditCustomer = null;

  document.getElementById("editResult").innerHTML = "";
  await showCustomers();
  await updateDashboard();
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

  let { error } = await db
    .from("customers")
    .update({balance:newBalance})
    .eq("id", c.id);

  if(error){
    alert("Payment Error: " + error.message);
    return;
  }

  await addLedger(
    c,
    "Payment Received",
    amount,
    newBalance
  );

  alert("Payment Saved");

  document.getElementById("payCustomer").value = "";
  document.getElementById("payAmount").value = "";

  await showCustomers();
  await updateDashboard();
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
    alert("Customer या Deposit Value गलत है");
    return;
  }

  let newBalance = Number(c.balance || 0) - value;

  let { error: depositError } = await db
    .from("deposits")
    .insert([{
      name: c.Name || "",
      mobile: c.mobile || "",
      deposit_type: type,
      weight: weight,
      purity: purity,
      value: value,
      note: note,
      created_at: nowISO()
    }]);

  if(depositError){
    alert("Deposit Error: " + depositError.message);
    return;
  }

  let { error: updateError } = await db
    .from("customers")
    .update({balance:newBalance})
    .eq("id", c.id);

  if(updateError){
    alert("Balance Update Error: " + updateError.message);
    return;
  }

  let ledgerType =
    type +
    " | Weight: " + (weight || "-") +
    " | Purity: " + (purity || "-") +
    " | Note: " + (note || "-");

  await addLedger(
    c,
    ledgerType,
    value,
    newBalance
  );

  alert("Deposit Saved");

  document.getElementById("depositCustomer").value = "";
  document.getElementById("depositWeight").value = "";
  document.getElementById("depositPurity").value = "";
  document.getElementById("depositValue").value = "";
  document.getElementById("depositNote").value = "";

  await showCustomers();
  await updateDashboard();
}

async function addExpense(){
  let category = document.getElementById("expenseCategory").value;
  let description = document.getElementById("expenseDescription").value;
  let amount = Number(document.getElementById("expenseAmount").value);

  if(isNaN(amount) || amount <= 0){
    alert("Expense Amount गलत है");
    return;
  }

  let { error } = await db
    .from("expenses")
    .insert([{
      category: category,
      description: description,
      amount: amount,
      created_at: nowISO()
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

function calcPurchase(){
  let weight = Number(document.getElementById("weight").value);
  let rate = Number(document.getElementById("rate").value);
  let making = Number(document.getElementById("making").value);

  let goldValue = weight * rate;
  let total = goldValue + (goldValue * making / 100);

  return {
    goldValue: goldValue,
    total: total
  };
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

  let { error: purchaseError } = await db
    .from("purchases")
    .insert([{
      mobile: c.mobile || "",
      item_name: item,
      weight: weight,
      gold_rate: rate,
      making_percent: making,
      total_amount: calc.total,
      created_at: nowISO()
    }]);

  if(purchaseError){
    alert("Purchase Error: " + purchaseError.message);
    return;
  }

  let { error: updateError } = await db
    .from("customers")
    .update({balance:newBalance})
    .eq("id", c.id);

  if(updateError){
    alert("Balance Update Error: " + updateError.message);
    return;
  }

  await addLedger(
    c,
    "Gold Purchase - " + item,
    calc.total,
    newBalance
  );

  alert("Purchase Saved");

  await showCustomers();
  await updateDashboard();
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
    <b>Date:</b> ${new Date().toLocaleString("en-IN")}<br>
    <b>Customer:</b> ${c.Name || ""}<br>
    <b>Father:</b> ${c.father_name || ""}<br>
    <b>City:</b> ${c.city || ""}<br>
    <b>Mobile:</b> ${c.mobile || "No Mobile"}<hr>
    <b>Item:</b> ${item}<br>
    <b>Weight:</b> ${weight} gm<br>
    <b>Rate:</b> ${money(rate)}<br>
    <b>Making:</b> ${making}%<hr>
    <h3>Total: ${money(calc.total)}</h3>
  </div>
  `;
}

async function showStatement(){
  let input = document.getElementById("statementCustomer").value;
  let c = await findCustomer(input);

  if(!c){
    document.getElementById("statementResult").innerHTML =
    "Customer Not Found";
    return;
  }

  let { data, error } = await db
    .from("ledger")
    .select("*")
    .or(`mobile.eq.${c.mobile},name.eq.${c.Name}`)
    .order("created_at", {ascending:true});

  if(error){
    document.getElementById("statementResult").innerHTML =
    "Statement Error: " + error.message;
    return;
  }

  lastStatementData = data || [];
  lastStatementCustomer = c;

  let html = `
  <div class="card">
    <h3>Statement</h3>
    <b>Name:</b> ${c.Name || ""}<br>
    <b>Father:</b> ${c.father_name || ""}<br>
    <b>City:</b> ${c.city || ""}<br>
    <b>Mobile:</b> ${c.mobile || "No Mobile"}<br>
    <b>Current Balance:</b> ${money(c.balance)}
  </div>
  `;

  (data || []).forEach(e=>{
    html += `
    <div class="card">
      <b>Date & Time:</b> ${dateTime(e.created_at)}<br>
      <b>Particular:</b> ${e.type || ""}<br>
      <b>Amount:</b> ${money(e.amount)}<br>
      <b>Balance:</b> ${money(e.balance)}
    </div>
    `;
  });

  document.getElementById("statementResult").innerHTML = html;
}

async function pendingReport(){
  let { data } = await db.from("customers").select("*");

  let html = "<h3>Pending Customers</h3>";
  let total = 0;

  (data || []).forEach(c=>{
    let bal = Number(c.balance || 0);

    if(bal > 0){
      total += bal;

      html += `
      <div class="card">
      ${c.Name} |
      ${c.mobile || "No Mobile"} |
      Pending: ${money(bal)}
      </div>
      `;
    }
  });

  html += `
  <div class="card">
  <b>Total Pending: ${money(total)}</b>
  </div>
  `;

  document.getElementById("pendingReport").innerHTML = html;
}

async function advanceReport(){
  let { data } = await db.from("customers").select("*");

  let html = "<h3>Advance Customers</h3>";
  let total = 0;

  (data || []).forEach(c=>{
    let bal = Number(c.balance || 0);

    if(bal < 0){
      total += Math.abs(bal);

      html += `
      <div class="card">
      ${c.Name} |
      ${c.mobile || "No Mobile"} |
      Advance: ${money(Math.abs(bal))}
      </div>
      `;
    }
  });

  html += `
  <div class="card">
  <b>Total Advance: ${money(total)}</b>
  </div>
  `;

  document.getElementById("advanceReport").innerHTML = html;
}

async function cashBook(){
  let { data: ledger } = await db.from("ledger").select("*");
  let { data: expenses } = await db.from("expenses").select("*");

  let income = 0;
  let expense = 0;
  let html = "<h3>Cash Book</h3>";

  (ledger || []).forEach(l=>{
    if(
      (l.type || "").includes("Payment") ||
      (l.type || "").includes("Deposit")
    ){
      income += Number(l.amount || 0);

      html += `
      <div class="card">
      IN |
      ${dateTime(l.created_at)} |
      ${l.type} |
      ${money(l.amount)}
      </div>
      `;
    }
  });

  (expenses || []).forEach(e=>{
    expense += Number(e.amount || 0);

    html += `
    <div class="card">
    OUT |
    ${dateTime(e.created_at)} |
    ${e.category} |
    ${e.description || ""} |
    ${money(e.amount)}
    </div>
    `;
  });

  html += `
  <div class="card">
  <b>Cash In Hand: ${money(income - expense)}</b>
  </div>
  `;

  document.getElementById("cashBookResult").innerHTML = html;
}

async function dailyClosing(){

  let { data: ledger } = await db.from("ledger").select("*");
  let { data: expenses } = await db.from("expenses").select("*");

  let collection = 0;
  let deposit = 0;
  let expenseTotal = 0;

  (ledger || []).forEach(l=>{

    let type = l.type || "";

    if(type.includes("Payment")){
      collection += Number(l.amount || 0);
    }

    if(type.includes("Deposit")){
      deposit += Number(l.amount || 0);
    }
  });

  (expenses || []).forEach(e=>{
    expenseTotal += Number(e.amount || 0);
  });

  let cash = collection + deposit - expenseTotal;

  document.getElementById("dailyClosingResult").innerHTML = `
  <div class="card">
  <h3>Daily Closing</h3>

  Total Collection :
  ${money(collection)}<br><br>

  Total Deposit :
  ${money(deposit)}<br><br>

  Total Expense :
  ${money(expenseTotal)}<br><br>

  Cash In Hand :
  <b>${money(cash)}</b>

  </div>
  `;
}

// ===== PDF FUNCTIONS =====

function downloadPendingPDF(){

  const { jsPDF } = window.jspdf;

  let doc = new jsPDF();

  doc.text(
    "NAND JEWELERS - Pending Report",
    10,
    10
  );

  let text =
    document.getElementById("pendingReport")
    .innerText || "No Data";

  doc.text(text,10,20);

  doc.save("pending-report.pdf");
}

function downloadAdvancePDF(){

  const { jsPDF } = window.jspdf;

  let doc = new jsPDF();

  doc.text(
    "NAND JEWELERS - Advance Report",
    10,
    10
  );

  let text =
    document.getElementById("advanceReport")
    .innerText || "No Data";

  doc.text(text,10,20);

  doc.save("advance-report.pdf");
}

function downloadStatementPDF(){

  if(!lastStatementCustomer){
    alert("पहले Statement View करो");
    return;
  }

  const { jsPDF } = window.jspdf;

  let doc = new jsPDF();

  doc.text(
    "NAND JEWELERS - Customer Statement",
    10,
    10
  );

  let y = 20;

  doc.text(
    "Customer: " +
    lastStatementCustomer.Name,
    10,
    y
  );

  y += 10;

  (lastStatementData || []).forEach(row=>{

    let line =
      dateTime(row.created_at) +
      " | " +
      row.type +
      " | " +
      row.amount;

    doc.text(line,10,y);

    y += 8;

    if(y > 270){
      doc.addPage();
      y = 10;
    }
  });

  doc.save(
    lastStatementCustomer.Name +
    "-statement.pdf"
  );
}

// ===== APP START =====

showCustomers();
updateDashboard();

async function loadCustomerForEdit(){
  let input = document.getElementById("editCustomerSearch").value;
  let c = await findCustomer(input);

  if(!c){
    alert("Customer Not Found");
    return;
  }

  loadedEditCustomer = c;

  document.getElementById("editName").value = c.Name || "";
  document.getElementById("editFather").value = c.father_name || "";
  document.getElementById("editCity").value = c.city || "";
  document.getElementById("editMobile").value = c.mobile || "";
  document.getElementById("editBalance").value = c.balance || 0;

  alert("Customer Loaded");
}

async function updateCustomer(){
  if(!loadedEditCustomer){
    alert("पहले customer load करो");
    return;
  }

  let { error } = await db.from("customers")
    .update({
      Name: document.getElementById("editName").value,
      father_name: document.getElementById("editFather").value,
      city: document.getElementById("editCity").value,
      mobile: document.getElementById("editMobile").value,
      balance: Number(document.getElementById("editBalance").value)
    })
    .eq("id", loadedEditCustomer.id);

  if(error){
    alert("Update Error: " + error.message);
    return;
  }

  alert("Customer Updated");
  loadedEditCustomer = null;
  showCustomers();
  updateDashboard();
}

async function deleteCustomer(){
  if(!loadedEditCustomer){
    alert("पहले customer load करो");
    return;
  }

  if(!confirm("Delete this customer?")){
    return;
  }

  let { error } = await db.from("customers")
    .delete()
    .eq("id", loadedEditCustomer.id);

  if(error){
    alert("Delete Error: " + error.message);
    return;
  }

  alert("Customer Deleted");
  loadedEditCustomer = null;
  showCustomers();
  updateDashboard();
}

function downloadStatementPDF(){
  alert("PDF button working. पहले View Statement दबाओ.");

  if(!lastStatementCustomer){
    return;
  }

  const { jsPDF } = window.jspdf;
  let doc = new jsPDF();

  doc.text("NAND JEWELERS - Statement", 10, 10);
  doc.text("Customer: " + lastStatementCustomer.Name, 10, 20);

  let y = 30;

  (lastStatementData || []).forEach(row=>{
    doc.text(
      dateTime(row.created_at) + " | " + row.type + " | " + row.amount,
      10,
      y
    );
    y += 8;
  });

  doc.save("statement.pdf");
}

function downloadPendingPDF(){
  alert("Pending PDF working. पहले Pending Customers Report दबाओ.");

  const { jsPDF } = window.jspdf;
  let doc = new jsPDF();

  doc.text("NAND JEWELERS - Pending Report", 10, 10);

  let text = document.getElementById("pendingReport").innerText || "No Data";
  doc.text(text, 10, 20);

  doc.save("pending-report.pdf");
}

function downloadAdvancePDF(){
  alert("Advance PDF working. पहले Advance Customers Report दबाओ.");

  const { jsPDF } = window.jspdf;
  let doc = new jsPDF();

  doc.text("NAND JEWELERS - Advance Report", 10, 10);

  let text = document.getElementById("advanceReport").innerText || "No Data";
  doc.text(text, 10, 20);

  doc.save("advance-report.pdf");
}

async function dailyClosing(){
  let { data: ledger } = await db.from("ledger").select("*");
  let { data: expenses } = await db.from("expenses").select("*");

  let collection = 0;
  let deposit = 0;
  let expenseTotal = 0;

  (ledger || []).forEach(l=>{
    let type = l.type || "";

    if(type.includes("Payment")){
      collection += Number(l.amount || 0);
    }

    if(type.includes("Deposit")){
      deposit += Number(l.amount || 0);
    }
  });

  (expenses || []).forEach(e=>{
    expenseTotal += Number(e.amount || 0);
  });

  let cash = collection + deposit - expenseTotal;

  document.getElementById("dailyClosingResult").innerHTML = `
    <div class="card">
      <h3>Daily Closing</h3>
      Total Collection: ${money(collection)}<br>
      Total Deposit: ${money(deposit)}<br>
      Total Expense: ${money(expenseTotal)}<br>
      <b>Cash In Hand: ${money(cash)}</b>
    </div>
  `;

  alert("Daily Closing Report Ready");
}
window.loadCustomerForEdit = loadCustomerForEdit;
window.updateCustomer = updateCustomer;
window.deleteCustomer = deleteCustomer;
window.downloadStatementPDF = downloadStatementPDF;
window.downloadPendingPDF = downloadPendingPDF;
window.downloadAdvancePDF = downloadAdvancePDF;
window.dailyClosing = dailyClosing;

async function addCustomerNote(){
  let input = document.getElementById("noteCustomer").value;
  let note = document.getElementById("noteText").value;

  let c = await findCustomer(input);

  if(!c || note.trim() === ""){
    alert("Customer या Note खाली है");
    return;
  }

  let { error } = await db.from("customer_notes").insert([{
    name: c.Name || "",
    mobile: c.mobile || "",
    note: note,
    created_at: nowISO()
  }]);

  if(error){
    alert("Note Error: " + error.message);
    return;
  }

  await db.from("customers")
    .update({ notes: note })
    .eq("id", c.id);

  alert("Note Saved");

  document.getElementById("noteText").value = "";

  showCustomerNotes();
}

async function showCustomerNotes(){
  let input = document.getElementById("noteCustomer").value;
  let c = await findCustomer(input);

  if(!c){
    document.getElementById("noteResult").innerHTML =
    "Customer Not Found";
    return;
  }

  let { data, error } = await db
    .from("customer_notes")
    .select("*")
    .or(`mobile.eq.${c.mobile},name.eq.${c.Name}`)
    .order("created_at", {ascending:false});

  if(error){
    document.getElementById("noteResult").innerHTML =
    "Note Error: " + error.message;
    return;
  }

  let html = `
  <div class="card">
    <b>Customer:</b> ${c.Name || ""}<br>
    <b>Mobile:</b> ${c.mobile || "No Mobile"}<br>
    <b>Latest Note:</b> ${c.notes || ""}
  </div>
  `;

  (data || []).forEach(n=>{
    html += `
    <div class="card">
      <b>Date & Time:</b> ${dateTime(n.created_at)}<br>
      <b>Note:</b> ${n.note || ""}
    </div>
    `;
  });

  document.getElementById("noteResult").innerHTML = html;
}

window.addCustomerNote = addCustomerNote;
window.showCustomerNotes = showCustomerNotes;
window.addCustomerNote = addCustomerNote;
window.showCustomerNotes = showCustomerNotes;

window.addCustomerNote = addCustomerNote;
window.showCustomerNotes = showCustomerNotes;

async function showDepositHistory(){
  let input = document.getElementById("depositCustomer").value;
  let c = await findCustomer(input);

  if(!c){
    document.getElementById("depositHistory").innerHTML =
    "Customer Not Found";
    return;
  }

  let { data, error } = await db
    .from("deposits")
    .select("*")
    .or(`mobile.eq.${c.mobile},name.eq.${c.Name}`)
    .order("created_at", {ascending:false});

  if(error){
    document.getElementById("depositHistory").innerHTML =
    "Deposit Error: " + error.message;
    return;
  }

  let html = `
  <div class="card">
    <b>Customer:</b> ${c.Name || ""}<br>
    <b>Mobile:</b> ${c.mobile || "No Mobile"}
  </div>
  `;

  if(!data || data.length === 0){
    html += `<div class="card">No Deposit Found</div>`;
  }

  (data || []).forEach(d=>{
    html += `
    <div class="card">
      <b>Date & Time:</b> ${dateTime(d.created_at)}<br>
      <b>Type:</b> ${d.deposit_type || ""}<br>
      <b>Weight:</b> ${d.weight || "-"}<br>
      <b>Purity:</b> ${d.purity || "-"}<br>
      <b>Value:</b> ${money(d.value)}<br>
      <b>Note:</b> ${d.note || ""}
    </div>
    `;
  });

  document.getElementById("depositHistory").innerHTML = html;
}

window.showDepositHistory = showDepositHistory;
window.showDepositHistory = showDepositHistory;

async function showExpenseHistory(){
  let { data, error } = await db
    .from("expenses")
    .select("*")
    .order("created_at", {ascending:false});

  if(error){
    document.getElementById("expenseHistory").innerHTML =
    "Expense Error: " + error.message;
    return;
  }

  let html = "<h3>Expense History</h3>";
  let total = 0;

  if(!data || data.length === 0){
    html += `<div class="card">No Expense Found</div>`;
  }

  (data || []).forEach(e=>{
    total += Number(e.amount || 0);

    html += `
    <div class="card">
      <b>Date & Time:</b> ${dateTime(e.created_at)}<br>
      <b>Category:</b> ${e.category || ""}<br>
      <b>Description:</b> ${e.description || ""}<br>
      <b>Amount:</b> ${money(e.amount)}
    </div>
    `;
  });

  html += `
  <div class="card">
    <b>Total Expense:</b> ${money(total)}
  </div>
  `;

  document.getElementById("expenseHistory").innerHTML = html;
}

async function monthlyReport(){
  let { data: ledger } = await db.from("ledger").select("*");
  let { data: expenses } = await db.from("expenses").select("*");
  let { data: purchases } = await db.from("purchases").select("*");
  let { data: deposits } = await db.from("deposits").select("*");

  let totalSales = 0;
  let totalCollection = 0;
  let totalDeposits = 0;
  let totalExpense = 0;

  (purchases || []).forEach(p=>{
    totalSales += Number(p.total_amount || 0);
  });

  (ledger || []).forEach(l=>{
    let type = l.type || "";

    if(type.includes("Payment")){
      totalCollection += Number(l.amount || 0);
    }
  });

  (deposits || []).forEach(d=>{
    totalDeposits += Number(d.value || 0);
  });

  (expenses || []).forEach(e=>{
    totalExpense += Number(e.amount || 0);
  });

  let netCash = totalCollection + totalDeposits - totalExpense;

  let html = `
  <div class="card">
    <h3>Monthly Report</h3>
    <b>Total Sales:</b> ${money(totalSales)}<br>
    <b>Total Collection:</b> ${money(totalCollection)}<br>
    <b>Total Deposit Value:</b> ${money(totalDeposits)}<br>
    <b>Total Expense:</b> ${money(totalExpense)}<br>
    <hr>
    <b>Net Cash:</b> ${money(netCash)}
  </div>
  `;

  document.getElementById("monthlyReportResult").innerHTML = html;

  let monthName = new Date().toLocaleString("en-IN", {
    month: "long",
    year: "numeric"
  });

  await db.from("monthly_reports").insert([{
    month: monthName,
    income: totalCollection + totalDeposits,
    expense: totalExpense,
    profit: netCash,
    created_at: nowISO()
  }]);
}

window.showExpenseHistory = showExpenseHistory;
window.monthlyReport = monthlyReport;
window.showExpenseHistory = showExpenseHistory;
window.monthlyReport = monthlyReport;

function downloadBillPDF(){
  let billText = document.getElementById("billResult").innerText;

  if(!billText || billText.trim() === ""){
    alert("पहले Generate Bill दबाओ");
    return;
  }

  const { jsPDF } = window.jspdf;
  let doc = new jsPDF();

  doc.text("NAND JEWELERS - Bill Invoice", 10, 10);

  let lines = doc.splitTextToSize(billText, 180);
  doc.text(lines, 10, 20);

  doc.save("nand-jewelers-bill.pdf");
}

function shareStatementWhatsApp(){
  if(!lastStatementCustomer || !lastStatementData){
    alert("पहले View Statement दबाओ");
    return;
  }

  let msg = "NAND JEWELERS STATEMENT%0A";
  msg += "Customer: " + (lastStatementCustomer.Name || "") + "%0A";
  msg += "Mobile: " + (lastStatementCustomer.mobile || "No Mobile") + "%0A";
  msg += "Balance: " + money(lastStatementCustomer.balance) + "%0A%0A";

  (lastStatementData || []).forEach(row=>{
    msg += dateTime(row.created_at) + "%0A";
    msg += row.type + "%0A";
    msg += "Amount: " + money(row.amount) + "%0A";
    msg += "Balance: " + money(row.balance) + "%0A%0A";
  });

  let url = "https://wa.me/?text=" + msg;
  window.open(url, "_blank");
}

window.downloadBillPDF = downloadBillPDF;
window.shareStatementWhatsApp = shareStatementWhatsApp;

window.downloadBillPDF = downloadBillPDF;
window.shareStatementWhatsApp = shareStatementWhatsApp;

async function businessSummary(){

  let { data: customers } = await db.from("customers").select("*");
  let { data: purchases } = await db.from("purchases").select("*");
  let { data: expenses } = await db.from("expenses").select("*");

  let pending = 0;
  let advance = 0;
  let sales = 0;
  let expense = 0;

  (customers || []).forEach(c=>{
    let bal = Number(c.balance || 0);

    if(bal > 0){
      pending += bal;
    }

    if(bal < 0){
      advance += Math.abs(bal);
    }
  });

  (purchases || []).forEach(p=>{
    sales += Number(p.total_amount || 0);
  });

  (expenses || []).forEach(e=>{
    expense += Number(e.amount || 0);
  });

  document.getElementById("businessSummaryResult").innerHTML = `
  <div class="card">
    <h3>Business Summary</h3>

    Total Customers :
    <b>${(customers || []).length}</b><br><br>

    Total Sales :
    <b>${money(sales)}</b><br><br>

    Total Pending :
    <b>${money(pending)}</b><br><br>

    Total Advance :
    <b>${money(advance)}</b><br><br>

    Total Expense :
    <b>${money(expense)}</b>

  </div>
  `;
}

async function topCustomers(){

  let { data } = await db
    .from("customers")
    .select("*");

  let list = (data || [])
    .sort((a,b)=>
      Number(b.balance || 0) -
      Number(a.balance || 0)
    )
    .slice(0,10);

  let html = `
  <div class="card">
  <h3>Top Pending Customers</h3>
  `;

  list.forEach(c=>{

    html += `
    ${c.Name || ""} -
    ${money(c.balance)}
    <br>
    `;
  });

  html += `</div>`;

  document.getElementById("topCustomersResult").innerHTML = html;
}

window.businessSummary = businessSummary;
window.topCustomers = topCustomers;

async function loginUser(){

  let username =
    document.getElementById("loginUsername").value;

  let password =
    document.getElementById("loginPassword").value;

  let { data, error } = await db
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password);

  if(error){
    alert(error.message);
    return;
  }

  if(!data || data.length === 0){

    document.getElementById("loginResult").innerHTML =
    "Invalid Login";

    return;
  }

  localStorage.setItem(
    "nand_login",
    "yes"
  );

  document.getElementById("loginScreen").style.display =
  "none";

  document.getElementById("mainApp").style.display =
  "block";

  alert("Login Success");
}

function checkLogin(){

  let logged =
    localStorage.getItem("nand_login");

  if(logged === "yes"){

    document.getElementById("loginScreen").style.display =
    "none";

    document.getElementById("mainApp").style.display =
    "block";

  }else{

    document.getElementById("loginScreen").style.display =
    "block";

    document.getElementById("mainApp").style.display =
    "none";
  }
}

window.loginUser = loginUser;

setTimeout(()=>{
  checkLogin();
},500);
window.loginUser = loginUser;
function logoutUser(){

  localStorage.clear();

  sessionStorage.clear();

  alert("Logged Out");

  window.location.href =
  "https://vikashsoni1945-a11y.github.io/nand-jewelers-web/?logout=1";
}

window.logoutUser = logoutUser;

async function downloadBackup(){

  let { data: customers } =
    await db.from("customers").select("*");

  let { data: ledger } =
    await db.from("ledger").select("*");

  let { data: expenses } =
    await db.from("expenses").select("*");

  let { data: deposits } =
    await db.from("deposits").select("*");

  let { data: purchases } =
    await db.from("purchases").select("*");

  let { data: notes } =
    await db.from("customer_notes").select("*");

  let backup = {
    backup_date: new Date().toLocaleString("en-IN"),
    customers,
    ledger,
    expenses,
    deposits,
    purchases,
    notes
  };

  let blob = new Blob(
    [JSON.stringify(backup,null,2)],
    {type:"application/json"}
  );

  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");

  a.href = url;

  a.download =
    "nand-jewelers-backup.json";

  a.click();

  document.getElementById("backupResult").innerHTML =
  "✅ Backup Downloaded";
}

window.downloadBackup = downloadBackup;

async function dateWiseReport(){

  let fromDate =
    document.getElementById("fromDate").value;

  let toDate =
    document.getElementById("toDate").value;

  if(!fromDate || !toDate){
    alert("Select Date Range");
    return;
  }

  let start =
    new Date(fromDate).getTime();

  let end =
    new Date(toDate + "T23:59:59").getTime();

  let { data: purchases } =
    await db.from("purchases").select("*");

  let { data: expenses } =
    await db.from("expenses").select("*");

  let { data: deposits } =
    await db.from("deposits").select("*");

  let { data: ledger } =
    await db.from("ledger").select("*");

  let sales = 0;
  let collection = 0;
  let depositValue = 0;
  let expense = 0;

  (purchases || []).forEach(p=>{

    let d =
      new Date(p.created_at).getTime();

    if(d >= start && d <= end){

      sales +=
        Number(p.total_amount || 0);
    }
  });

  (expenses || []).forEach(e=>{

    let d =
      new Date(e.created_at).getTime();

    if(d >= start && d <= end){

      expense +=
        Number(e.amount || 0);
    }
  });

  (deposits || []).forEach(d=>{

    let t =
      new Date(d.created_at).getTime();

    if(t >= start && t <= end){

      depositValue +=
        Number(d.value || 0);
    }
  });

  (ledger || []).forEach(l=>{

    let t =
      new Date(l.created_at).getTime();

    if(
      t >= start &&
      t <= end &&
      (l.type || "").includes("Payment")
    ){

      collection +=
        Number(l.amount || 0);
    }
  });

  let netCash =
    collection +
    depositValue -
    expense;

  document.getElementById(
    "dateReportResult"
  ).innerHTML = `

  <div class="card">

  <h3>Date Wise Report</h3>

  From :
  ${fromDate}<br><br>

  To :
  ${toDate}<br><br>

  Total Sales :
  <b>${money(sales)}</b><br><br>

  Total Collection :
  <b>${money(collection)}</b><br><br>

  Total Deposits :
  <b>${money(depositValue)}</b><br><br>

  Total Expense :
  <b>${money(expense)}</b><br><br>

  Net Cash :
  <b>${money(netCash)}</b>

  </div>
  `;
}

window.dateWiseReport = dateWiseReport;
window.dateWiseReport = dateWiseReport;
// ===== VERSION 6 PART 4 : RESTORE BACKUP SYSTEM =====

async function restoreBackup(){

  let fileInput = document.getElementById("restoreFile");

  if(!fileInput.files || fileInput.files.length === 0){
    alert("Backup file select karo");
    return;
  }

  let confirmRestore = confirm(
    "Restore karne se purana data duplicate ho sakta hai. Kya aap sure ho?"
  );

  if(!confirmRestore){
    return;
  }

  let file = fileInput.files[0];

  let text = await file.text();

  let backup = JSON.parse(text);

  if(backup.customers){
    await db.from("customers").insert(backup.customers);
  }

  if(backup.ledger){
    await db.from("ledger").insert(backup.ledger);
  }

  if(backup.expenses){
    await db.from("expenses").insert(backup.expenses);
  }

  if(backup.deposits){
    await db.from("deposits").insert(backup.deposits);
  }

  if(backup.purchases){
    await db.from("purchases").insert(backup.purchases);
  }

  if(backup.notes){
    await db.from("customer_notes").insert(backup.notes);
  }

  document.getElementById("restoreResult").innerHTML =
    "✅ Backup Restored Successfully";

  alert("Backup Restored");
}

window.restoreBackup = restoreBackup;

async function saveStock(){

  let metal = document.getElementById("stockMetal").value;
  let type = document.getElementById("stockType").value;
  let weight = Number(document.getElementById("stockWeight").value);
  let note = document.getElementById("stockNote").value;

  if(isNaN(weight) || weight <= 0){
    alert("Weight सही भरो");
    return;
  }

  let { error } = await db.from("stock").insert([{
    metal: metal,
    type: type,
    weight: weight,
    note: note,
    created_at: new Date().toISOString()
  }]);

  if(error){
    alert("Stock Error: " + error.message);
    return;
  }

  alert("Stock Saved");

  document.getElementById("stockWeight").value = "";
  document.getElementById("stockNote").value = "";

  showStockReport();
}

async function showStockReport(){

  let { data, error } = await db
    .from("stock")
    .select("*")
    .order("created_at", {ascending:false});

  if(error){
    document.getElementById("stockResult").innerHTML =
      "Stock Error: " + error.message;
    return;
  }

  let goldIn = 0;
  let goldOut = 0;
  let silverIn = 0;
  let silverOut = 0;

  let html = "<h3>Stock Report</h3>";

  (data || []).forEach(s=>{

    let w = Number(s.weight || 0);

    if(s.metal === "Gold" && s.type === "Stock In"){
      goldIn += w;
    }

    if(s.metal === "Gold" && s.type === "Stock Out"){
      goldOut += w;
    }

    if(s.metal === "Silver" && s.type === "Stock In"){
      silverIn += w;
    }

    if(s.metal === "Silver" && s.type === "Stock Out"){
      silverOut += w;
    }

    html += `
    <div class="card">
      <b>Date:</b> ${dateTime(s.created_at)}<br>
      <b>Metal:</b> ${s.metal}<br>
      <b>Type:</b> ${s.type}<br>
      <b>Weight:</b> ${s.weight} gm<br>
      <b>Note:</b> ${s.note || ""}
    </div>
    `;
  });

  html = `
  <div class="card">
    <h3>Current Stock</h3>
    <b>Gold Stock:</b> ${goldIn - goldOut} gm<br>
    <b>Silver Stock:</b> ${silverIn - silverOut} gm
  </div>
  ` + html;

  document.getElementById("stockResult").innerHTML = html;
}

window.saveStock = saveStock;
window.showStockReport = showStockReport;
function scrollToSection(id){

  let el = document.getElementById(id);

  if(!el){
    return;
  }

  let y =
    el.getBoundingClientRect().top +
    window.pageYOffset -
    70;

  window.scrollTo({
    top:y,
    behavior:"smooth"
  });
}

window.scrollToSection = scrollToSection;
function loadHeaderDate(){

  let d = new Date();

  document.getElementById(
    "todayDate"
  ).innerText =
  d.toLocaleDateString("en-IN",{
    day:"2-digit",
    month:"long",
    year:"numeric"
  });
}

setTimeout(()=>{
  loadHeaderDate();
},1000);
async function showTopPendingCustomers() {

    let { data: customers } =
    await db.from("customers").select("*");

    customers = (customers || [])
    .filter(c => Number(c.balance || 0) > 0)
    .sort((a,b) =>
        Number(b.balance || 0) -
        Number(a.balance || 0)
    )
    .slice(0,5);

    let html = "";

    customers.forEach((c,i)=>{
        html += `
        <div class="bill">
        ${i+1}. ${c.Name || c.name || ""}
        <br>
        Pending:
        ${money(c.balance)}
        </div>
        `;
    });

    document.getElementById(
        "topPendingResult"
    ).innerHTML = html;
}

async function showTopPurchaseCustomers() {

    let { data: purchases } =
    await db.from("purchases").select("*");

    let totals = {};

    (purchases || []).forEach(p => {

        let name =
        p.customer_name || "Unknown";

        let amount =
        Number(
        p.total_amount ||
        p.total || 0
        );

        totals[name] =
        (totals[name] || 0)
        + amount;

    });

    let top =
    Object.entries(totals)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5);

    let html = "";

    top.forEach((c,i)=>{

        html += `
        <div class="bill">
        ${i+1}. ${c[0]}
        <br>
        Purchase:
        ${money(c[1])}
        </div>
        `;

    });

    document.getElementById(
    "topPurchaseResult"
    ).innerHTML = html;

}
