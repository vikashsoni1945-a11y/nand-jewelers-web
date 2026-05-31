function getCustomers(){
  return JSON.parse(localStorage.getItem("customers")) || [];
}

function saveCustomers(customers){
  localStorage.setItem("customers", JSON.stringify(customers));
}

function showTab(tabId){
  let tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => tab.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");
}

function addCustomer(){
  let name = document.getElementById("name").value;
  let mobile = document.getElementById("mobile").value;
  let balance = document.getElementById("balance").value;

  if(name === "" || mobile === "" || balance === ""){
    alert("Please fill all fields");
    return;
  }

  let customers = getCustomers();

  customers.push({
    id: customers.length + 1,
    name: name,
    mobile: mobile,
    balance: Number(balance)
  });

  saveCustomers(customers);

  alert("Customer added successfully");

  document.getElementById("name").value = "";
  document.getElementById("mobile").value = "";
  document.getElementById("balance").value = "";

  showCustomers();
}

function showCustomers(){
  let customers = getCustomers();
  let list = document.getElementById("customerList");

  list.innerHTML = "";

  if(customers.length === 0){
    list.innerHTML = "<p>No customers found</p>";
    return;
  }

  customers.forEach(customer => {
    list.innerHTML += `
      <div class="card">
        <b>ID:</b> ${customer.id}<br>
        <b>Name:</b> ${customer.name}<br>
        <b>Mobile:</b> ${customer.mobile}<br>
        <b>Balance:</b> ₹${customer.balance}
      </div>
    `;
  });
}

function searchCustomer(){
  let mobile = document.getElementById("searchMobile").value;
  let customers = getCustomers();
  let result = document.getElementById("searchResult");

  let customer = customers.find(c => c.mobile === mobile);

  if(!customer){
    result.innerHTML = "<p>Customer not found</p>";
    return;
  }

  result.innerHTML = `
    <div class="card">
      <b>Customer Found</b><br>
      <b>Name:</b> ${customer.name}<br>
      <b>Mobile:</b> ${customer.mobile}<br>
      <b>Balance:</b> ₹${customer.balance}
    </div>
  `;
}

showCustomers();
