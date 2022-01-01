Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', {
  color: 'black'
});

var chartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: "",
      padding: {
        top: 1,
        bottom: 1
      }
    },
  },
  elements: {
    point:{
      radius: 0
    }
  },
  animation: {
    duration: 0
  }
};

chartOptions = JSON.parse(JSON.stringify(chartOptions));
chartOptions.plugins.title.text = "Money";
const moneyCtx = document.getElementById('money-chart').getContext('2d');
const moneyChart = new Chart(moneyCtx, {
  type: 'bar',
  data: {
    labels: [''],
    datasets: [{
        label: "",
        data: [0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 2
      },
      {
        label: "",
        data: [0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.2)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 2
      }
    ]
  },
  options: chartOptions
});


const utilityCtx = document.getElementById('utility-chart').getContext('2d');
const utilityChart = new Chart(utilityCtx, {
  type: 'bar',
  data: {
    labels: ['', ''],
    datasets: [{
        label: '',
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
    plugins: {
      title: {
        display: true,
        text: "Utility",
        padding: {
          top: 1,
          bottom: 1
        }
      },
      legend: {
        display: false
      }
    },
  }
});

chartOptions = JSON.parse(JSON.stringify(chartOptions));
chartOptions.plugins.title.text = "Money";
const moneyLineCtx = document.getElementById('money-line').getContext('2d');
const moneyLineChart = new Chart(moneyLineCtx, {
  type: 'line',
  data: {
    labels: [""],
    datasets: [{
        label: "",
        data: [0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 2
      },
      {
        label: "",
        data: [0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.2)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 2
      }
    ]
  },
  options: chartOptions,
});

chartOptions = JSON.parse(JSON.stringify(chartOptions));
chartOptions.plugins.title.text = "Utility";
const utilityLineCtx = document.getElementById('utility-line').getContext('2d');
const utilityLineChart = new Chart(utilityLineCtx, {
  type: 'line',
  data: {
    labels: [""],
    datasets: [{
        label: "",
        data: [0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 2
      },
      {
        label: "",
        data: [0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.2)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 2
      }
    ]
  },
  options: chartOptions,
});
