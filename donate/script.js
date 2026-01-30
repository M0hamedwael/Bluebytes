document.addEventListener('DOMContentLoaded', () => {
const nav = document.querySelector("nav");
const logo = document.querySelector(".logo-wrap");
const links = document.querySelectorAll(".nav-links a");
const donate = document.querySelector(".donate-btn");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        nav.classList.add("scrolled");
        donate.classList.add("scrolled");
        links.forEach(l => l.classList.add("scrolled"));
    } else {
        nav.classList.remove("scrolled");
        donate.classList.remove("scrolled");
        links.forEach(l => l.classList.remove("scrolled"));
    }
});

    const EXCHANGE_RATE = 50; 
    let baseDonation = 50; // to use it everywhere
    let baseRaised = 780000;
    let baseGoal = 1000000;
    let currency = "USD"; 
    let isCustom = false;

   
    const currencySelect = document.getElementById('currency-select');
    const currencySymbols = document.querySelectorAll('.currency-symbol');
    const currencyPrefix = document.querySelector('.currency-prefix');
    const raisedText = document.getElementById('raised-text');
    const goalText = document.getElementById('goal-text');
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customBox = document.querySelector('.custom-amount-box');
    const customInput = document.getElementById('custom-input-field');
    const form = document.getElementById('donation-form');
    const supportersDisplay = document.querySelector('.supporters');
    const donutChart = document.querySelector('.donut-chart');
    const chartText = document.querySelector('.center-hole');

   
    currencySelect.addEventListener('change', (e) => {
        currency = e.target.value;
        updatePageCurrency();
    });

    function updatePageCurrency() {
        const symbol = currency === 'USD' ? '$' : 'LE';
        const rate = currency === 'USD' ? 1 : EXCHANGE_RATE;

        currencySymbols.forEach(span => span.innerText = symbol);
        currencyPrefix.innerText = symbol;

        raisedText.innerText = formatMoney(baseRaised * rate);
        goalText.innerText = formatMoney(baseGoal * rate);

        amountBtns.forEach(btn => {
            const usdAmount = parseInt(btn.getAttribute('data-usd')); 
            if (usdAmount) {
                let newAmount = usdAmount * rate;
                btn.innerHTML = `${newAmount}<span class="currency-symbol">${symbol}</span>`;
            }
        });

        if(isCustom) {
            customInput.value = '';
            customInput.placeholder = `Enter ${currency} amount`;
        }
    }

    function formatMoney(amount) {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1).replace('.0', '') + 'M';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + 'k';
        }
        return amount;
    }

    amountBtns.forEach(btn => {
        let textVal = parseInt(btn.innerText);
        if(!isNaN(textVal)) {
            btn.setAttribute('data-usd', textVal);
        }

        btn.addEventListener('click', () => {
            amountBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            const type = btn.getAttribute('data-amount');

            if (type === 'custom') {
                isCustom = true;
                customBox.classList.remove('hidden'); 
                customInput.focus();
                baseDonation = 0; 
            } else {
                isCustom = false;
                customBox.classList.add('hidden');
                baseDonation = parseInt(btn.getAttribute('data-usd'));
            }
        });
    });

    customInput.addEventListener('input', (e) => {
        if (isCustom) {
            let val = parseInt(e.target.value) || 0;
            baseDonation = val; 
        }
    });

    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        
        if (baseDonation <= 0) {
            alert("Please enter a valid donation amount!");
            return;
        }

        const donateBtn = document.querySelector('.donate-submit-btn');
        
        
        donateBtn.innerText = "Processing...";
        donateBtn.style.opacity = "0.7";
        donateBtn.style.pointerEvents = "none";
        donateBtn.style.cursor = "wait";

        setTimeout(() => {
           
            fireConfetti();
            
            let currentSupporters = parseInt(supportersDisplay.innerText.replace(/,/g, '').split(' ')[0]);
            supportersDisplay.innerText = (currentSupporters + 1).toLocaleString() + " Supporters";
            let addedUsd = currency === 'USD' ? baseDonation : (baseDonation / EXCHANGE_RATE);
            baseRaised += addedUsd;
            
            updatePageCurrency();

          
            updateChart(83); 
            chartText.innerText = "83%";
            donateBtn.innerText = "Donation Received! 🎉";
            donateBtn.style.background = "#28a745"; 
            donateBtn.style.cursor = "default";

            setTimeout(() => {
                donateBtn.innerText = "Donate Now"; // fix the text error
                donateBtn.style.background = "linear-gradient(135deg, #1B6CA8 0%, #145585 100%)"; 
                donateBtn.style.opacity = "1";
                donateBtn.style.pointerEvents = "all"; 
                donateBtn.style.cursor = "pointer";
            }, 3000);

        }, 1500); 
    });

    updatePageCurrency();
    
    setTimeout(() => {
        updateChart(78);
        chartText.innerText = "78%";
    }, 500);

    function updateChart(percent) {
        donutChart.style.background = `conic-gradient(#4BCBE0 0% ${percent}%, #E0E0E0 ${percent}% 100%)`;
    }

    function fireConfetti() {
        if (typeof confetti === 'function') {
            var count = 200;
            var defaults = { origin: { y: 0.7 } };
            function fire(particleRatio, opts) {
                confetti(Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio)
                }));
            }
            fire(0.25, { spread: 26, startVelocity: 55, });
            fire(0.2, { spread: 60, });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        } else {
            console.log("Confetti library not loaded");
        }
    }
    
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    const payOptions = document.querySelectorAll('.pay-option');
    payOptions.forEach(option => {
        option.addEventListener('click', () => {
            payOptions.forEach(p => p.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
});
