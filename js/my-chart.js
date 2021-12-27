Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', {
  color: 'black'
});

const moneyCtx = document.getElementById('money-chart').getContext('2d');
const moneyChart = new Chart(moneyCtx, {
  type: 'bar',
  data: {
    labels: ['', ''],
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
      // x: {
      //   title: {
      //     display: true,
      //     text: "Money",
      //   }
      // },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Money",
        }
      },
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
});


const utilityCtx = document.getElementById('utility-chart').getContext('2d');
const utilityChart = new Chart(utilityCtx, {
  type: 'bar',
  data: {
    labels: ['', ''],
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
      // x: {
      //   title: {
      //     display: true,
      //     text: "Money",
      //   }
      // },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Utility",
        }
      },
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
});
