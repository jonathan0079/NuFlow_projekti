
export async function fetchTrendData(days) {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
  
    const response = await fetch(`http://localhost:3000/api/entries/range?days=${days}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  
    const data = await response.json();
    return data.map(entry => ({
      date: new Date(entry.date).toLocaleDateString("fi-FI"),
      value: entry.current_mood
    }));
  }
  
  export function drawAmChart(containerId, data, label) {
    am5.ready(function () {
      const root = am5.Root.new(containerId);
      root.setThemes([am5themes_Animated.new(root)]);
  
      const chart = root.container.children.push(
        am5xy.XYChart.new(root, {})
      );
  
      const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, {
          categoryField: "date",
          renderer: am5xy.AxisRendererX.new(root, {})
        })
      );
  
      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, {})
        })
      );
  
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: label,
          xAxis,
          yAxis,
          valueYField: "value",
          categoryXField: "date",
          tooltip: am5.Tooltip.new(root, {
            labelText: "{valueY}"
          })
        })
      );
  
      xAxis.data.setAll(data);
      series.data.setAll(data);
  
      series.appear(1000);
      chart.appear(1000, 100);
    });
  }
  