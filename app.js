function getCustomers(){
return JSON.parse(
localStorage.getItem("customers")
) || [];
}

function saveCustomers(data){
localStorage.setItem(
"customers",
JSON.stringify(data)
);
}

function addCustomer(){

let customers=getCustomers();

customers.push({
id:Date.now(),
name:document.getElementById("name").value,
mobile:document.getElementById("mobile").value,
balance:Number(
document.getElementById("balance").value
)
});

saveCustomers(customers);

alert("Customer Saved");

showCustomers();

}

function receivePayment(){

let mobile=
document.getElementById("payMobile").value;

let amount=
Number(
document.getElementById("payAmount").value
);

let customers=getCustomers();

let customer=
customers.find(
c=>c.mobile===mobile
);

if(!customer){
alert("Customer Not Found");
return;
}

customer.balance=
customer.balance-amount;

saveCustomers(customers);

alert("Payment Saved");

showCustomers();

}

function goldPurchase(){

let mobile=
document.getElementById("purchaseMobile").value;

let item=
document.getElementById("itemName").value;

let weight=
Number(
document.getElementById("weight").value
);

let rate=
Number(
document.getElementById("rate").value
);

let making=
Number(
document.getElementById("making").value
);

let total=
(weight*rate)+making;

let customers=getCustomers();

let customer=
customers.find(
c=>c.mobile===mobile
);

if(!customer){
alert("Customer Not Found");
return;
}

customer.balance=
customer.balance+total;

saveCustomers(customers);

alert(
item+" Saved\nTotal ₹"+total
);

showCustomers();

}

function searchCustomer(){

let mobile=
document.getElementById("searchMobile").value;

let customers=getCustomers();

let customer=
customers.find(
c=>c.mobile===mobile
);

if(!customer){

document.getElementById(
"searchResult"
).innerHTML=
"Customer Not Found";

return;
}

document.getElementById(
"searchResult"
).innerHTML=
`
<div class="card">
Name: ${customer.name}<br>
Mobile: ${customer.mobile}<br>
Balance: ₹${customer.balance}
</div>
`;

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

document.getElementById(
"customerList"
).innerHTML=html;

}

showCustomers();
