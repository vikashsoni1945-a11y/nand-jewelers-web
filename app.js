function addCustomer() {
    let name = document.getElementById("name").value;
    let mobile = document.getElementById("mobile").value;
    let balance = document.getElementById("balance").value;

    alert(
        "Customer Saved!\n\n" +
        "Name: " + name +
        "\nMobile: " + mobile +
        "\nBalance: " + balance
    );
}
