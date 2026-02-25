import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyCaGpHn224hN8BLN5ognGjaC2FQLT-QsRE",
    authDomain: "nurotwin.firebaseapp.com",
    projectId: "nurotwin",
    storageBucket: "nurotwin.firebasestorage.app",
    messagingSenderId: "421221799326",
    appId: "1:421221799326:web:727e7ce802735a8577328f"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 


const form = document.querySelector("form"),
    usernameField = form.querySelector(".username-field"),
    usernameInput = usernameField.querySelector(".username"),
    emailField = form.querySelector(".email-field"),
    emailInput = emailField.querySelector(".email"),
    passField = form.querySelector(".create-password"),
    passInput = passField.querySelector(".password"),
    cPassField = form.querySelector(".confirm-password"),
    cPassInput = cPassField.querySelector(".cPassword");





function checkusername() {
    const usernamePattern = /^(?=.*[a-z]{2,3}$)/; 
    if (!usernameInput.value.match(usernamePattern)) {
        return usernameField.classList.add("invalid");
    }
    usernameField.classList.remove("invalid");
}


function checkEmail() {
    const emaiPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!emailInput.value.match(emaiPattern)) {
        return emailField.classList.add("invalid");
    }
    emailField.classList.remove("invalid");
}

function createPass() {
    const passPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passInput.value.match(passPattern)) {
        return passField.classList.add("invalid");
    }
    passField.classList.remove("invalid");
}

function confirmPass() {
    if (passInput.value !== cPassInput.value || cPassInput.value === "") {
        return cPassField.classList.add("invalid");
    }
    cPassField.classList.remove("invalid");
}


const eyeIcons = document.querySelectorAll(".show-hide");
eyeIcons.forEach((eyeIcon) => {
    eyeIcon.addEventListener("click", () => {
        const pInput = eyeIcon.parentElement.querySelector("input");
        if (pInput.type === "password") {
            eyeIcon.classList.replace("bx-hide", "bx-show");
            pInput.type = "text";
        } else {
            eyeIcon.classList.replace("bx-show", "bx-hide");
            pInput.type = "password";
        }
    });
});




form.addEventListener("submit", (e) => {
    e.preventDefault(); 

    
    checkEmail();
    checkusername();
    createPass();
    confirmPass();

    
    usernameInput.addEventListener("keyup", checkusername);
    emailInput.addEventListener("keyup", checkEmail);
    passInput.addEventListener("keyup", createPass);
    cPassInput.addEventListener("keyup", confirmPass);

    
    if (
        !usernameField.classList.contains("invalid") &&
        !emailField.classList.contains("invalid") &&
        !passField.classList.contains("invalid") &&
        !cPassField.classList.contains("invalid")
    ) {
        
        
        const email = emailInput.value;
        const password = passInput.value;
        const username = usernameInput.value;
        createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;

        // Update the user's profile with the username
        updateProfile(user, {
            displayName: username
        }).then(() => {
            console.log("Username saved:", user.displayName);
            alert(`Signup successful! Welcome, ${username}`);
            
            // Redirect to dashboard
            window.location.href = "dashboard.html";
        }).catch((error) => {
            console.error("Error saving username:", error);
        });
    })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                
               
                if(errorCode === 'auth/email-already-in-use') {
                    alert("This email is already registered.");
                    emailField.classList.add("invalid");
                } else if(errorCode === 'auth/weak-password') {
                    alert("Password is too weak.");
                } else {
                    alert(errorMessage);
                }
            });
    }
});