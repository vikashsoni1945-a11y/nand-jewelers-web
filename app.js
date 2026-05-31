function getCustomers(){
return JSON.parse(localStorage.getItem("customers")) || [];
}

function saveCustomers(data){
localStorage.setItem("customers", JSON.stringify(data));
}

function getLedger(){
return JSON.parse(localStorage.getItem("ledger")) || [];
}

function saveLedger(data){
localStorage.setItem("ledger", JSON.stringify(data));
}

function getPurchases(){
return JSON.parse(localStorage.getItem("purchases")) || [];
}

function savePurchases(data){
localStorage.setItem("purchases", JSON.stringify(data));
}

function getDateTime(){
let now = new Date();
return now.toLocaleString("en-IN");
}

function addLedger(mobile,name,type,amount,balance){
let ledger=getLedger();

ledger.push({
date:getDateTime(),
mobile:mobile,
name:name,
type:type,
amount:amount,
balance:balance
});

saveLedger(ledger);
}

function addCustomer(){
let customers=getCustomers();

let name=document.getElementById("name").value;
let mobile=document.getElementById("mobile").value;
let balance=Number(document.getElementById("balance").value);

if(name==="" || mobile==="" || balance===""){
alert("Fill all customer fields");
return;
}

customers.push({
id:Date.now(),
name:name,
mobile:mobile,
balance:balance
});

saveCustomers(customers);

addLedger(mobile,name,"Opening Balance",balance,balance);

alert("Customer Saved");
showCustomers();
}

function receivePayment(){
let mobile=document.getElementById("payMobile").value;
let amount=Number(document.getElementById("payAmount").value);

let customers=getCustomers();
let customer=customers.find(c=>c.mobile===mobile);

if(!customer){
alert("Customer Not Found");
return;
}

customer.balance=customer.balance-amount;

saveCustomers(customers);

addLedger(customer.mobile,customer.name,"Payment Received",amount,customer.balance);

alert("Payment Saved");
showCustomers();
}

function calculatePurchase(){
let weight=Number(document.getElementById("weight").value);
let rate=Number(document.getElementById("rate").value);
let makingPercent=Number(document.getElementById("making").value);

let goldValue=weight*rate;
let makingAmount=(goldValue*makingPercent)/100;
let total=goldValue+makingAmount;

return {
goldValue:goldValue,
makingAmount:makingAmount,
total:total
};
}

function goldPurchase(){
let mobile=document.getElementById("purchaseMobile").value;
let item=document.getElementById("itemName").value;
let weight=Number(document.getElementById("weight").value);
let rate=Number(document.getElementById("rate").value);
let makingPercent=Number(document.getElementById("making").value);

let customers=getCustomers();
let customer=customers.find(c=>c.mobile===mobile);

if(!customer){
alert("Customer Not Found");
return;
}

let calc=calculatePurchase();

customer.balance=customer.balance+calc.total;

saveCustomers(customers);

let purchases=getPurchases();

purchases.push({
date:getDateTime(),
mobile:customer.mobile,
name:customer.name,
item:item,
weight:weight,
rate:rate,
makingPercent:makingPercent,
goldValue:calc.goldValue,
makingAmount:calc.makingAmount,
total:calc.total
});

savePurchases(purchases);

addLedger(customer.mobile,customer.name,"Gold Purchase - "+item,calc.total,customer.balance);

alert("Purchase Saved");
showCustomers();
}

function generateBill(){
let mobile=document.getElementById("purchaseMobile").value;
let item=document.getElementById("itemName").value;
let weight=Number(document.getElementById("weight").value);
let rate=Number(document.getElementById("rate").value);
let makingPercent=Number(document.getElementById("making").value);

let customers=getCustomers();
let customer=customers.find(c=>c.mobile===mobile);

if(!customer){
alert("Customer Not Found");
return;
}

let calc=calculatePurchase();

let billHTML =
`
<div class="bill">
<h2>NAND JEWELERS</h2>
<p><b>Date:</b> ${getDateTime()}</p>
<p><b>Customer:</b> ${customer.name}</p>
<p><b>Mobile:</b> ${customer.mobile}</p>
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

document.getElementById("billResult").innerHTML=billHTML;
}

function searchCustomer(){
let mobile=document.getElementById("searchMobile").value;
let customers=getCustomers();
let customer=customers.find(c=>c.mobile===mobile);

if(!customer){
document.getElementById("searchResult").innerHTML="Customer Not Found";
return;
}

document.getElementById("searchResult").innerHTML=
`
<div class="card">
Name: ${customer.name}<br>
Mobile: ${customer.mobile}<br>
Balance: ₹${customer.balance}
</div>
`;
}

function showStatement(){
let mobile=document.getElementById("statementMobile").value;
let ledger=getLedger();
let entries=ledger.filter(e=>e.mobile===mobile);

let html="";

if(entries.length===0){
document.getElementById("statementResult").innerHTML="No Statement Found";
return;
}

entries.forEach(e=>{
html+=`
<div class="card">
Date: ${e.date}<br>
Type: ${e.type}<br>
Amount: ₹${e.amount}<br>
Balance: ₹${e.balance}
</div>
`;
});

document.getElementById("statementResult").innerHTML=html;
}

function showCustomers(){
let customers=getCustomers();
let html="";

customers.forEach(c=>{
html+=`
<div class="card">
Name: ${c.name}<br>
Mobile: ${c.mobile}<br>
Balance: ₹${c.balance}
</div>
`;
});

document.getElementById("customerList").innerHTML=html;
}

showCustomers();
