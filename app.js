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

customers.push({
id:Date.now(),
name:name,
mobile:mobile,
balance:balance
});

saveCustomers(customers);

addLedger(
mobile,
name,
"Opening Balance",
balance,
balance
);

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

addLedger(
customer.mobile,
customer.name,
"Payment Received",
amount,
customer.balance
);

alert("Payment Saved");

showCustomers();
}

function goldPurchase(){
let mobile=document.getElementById("purchaseMobile").value;
let item=document.getElementById("itemName").value;
let weight=Number(document.getElementById("weight").value);
let rate=Number(document.getElementById("rate").value);
let makingPercent=Number(document.getElementById("making").value);

let goldValue=weight*rate;
let makingAmount=(goldValue*makingPercent)/100;
let total=goldValue+makingAmount;

let customers=getCustomers();
let customer=customers.find(c=>c.mobile===mobile);

if(!customer){
alert("Customer Not Found");
return;
}

customer.balance=customer.balance+total;

saveCustomers(customers);

addLedger(
customer.mobile,
customer.name,
"Gold Purchase - "+item,
total,
customer.balance
);

alert(
"Gold Value: ₹"+goldValue+
"\nMaking "+makingPercent+"%: ₹"+makingAmount+
"\nTotal: ₹"+total
);

showCustomers();
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
