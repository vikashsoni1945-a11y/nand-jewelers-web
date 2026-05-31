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

let goldValue=
