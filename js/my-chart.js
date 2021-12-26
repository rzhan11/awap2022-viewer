
const moneyCtx = document.getElementById('money-chart').getContext('2d');
const moneyChart = new Chart(moneyCtx, {
    type: 'bar',
    data: {
        labels: ['Red', 'Blue'],
        datasets: [{
            label: 'Money',
            data: [0, 0],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});


const utilityCtx = document.getElementById('utility-chart').getContext('2d');
const utilityChart = new Chart(utilityCtx, {
    type: 'bar',
    data: {
        labels: ['Red', 'Blue'],
        datasets: [{
            label: 'Utility',
            data: [0, 0],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
