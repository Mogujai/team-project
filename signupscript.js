const loginButton = document.getElementById("signup");

document.getElementById("signup_button").addEventListener("click", function() {
    loginButton.onsubmit()

    var inputs = document.forms["signup"].getElementsByTagName("input");
    console.log(inputs);
})

//validation() {
//    var usercheck = /^[a-zA-Z0-9_\.]+$/;
//    var passwordcheck = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,32}$/;
//    var emailcheck =/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
//}