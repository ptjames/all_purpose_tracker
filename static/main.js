var user = ''
var input_data = {}
var inputs_series = {}

// Ensuring Document Is Ready To Fire Functions
$(document).ready(function(e) {

  // Loading Existing Data
  $.ajax({
    url: "http://66.228.40.96:5000/loadinputs/",
    type: "post",
    data: {},
    success: function(response) {
      console.log(response)
      input_data = response
      users = []
      for (var user in input_data) { users.push(user) }
      define_users(users, input_data)
      handle_inputs(input_data[users[0]], users[0], 2028)
    },
    error: function(xhr) {
      console.log('error');
    }
  });

  // Define Users
  function define_users(users, input_data) {
    var navigation = document.getElementById("navigation");
    for (i = 0; i < users.length; i++) {
      var div = document.createElement('div')
      div.setAttribute("class", "navigation_div")
      div.setAttribute("user", users[i])
      div.innerHTML = users[i]
      div.addEventListener("click", function (e) {
        switch_users(e.target, input_data)
      });
      navigation.appendChild(div)
    };
  };

  // Switch Users
  function switch_users(target, input_data) {
    user = target.getAttribute("user")
    inputs = input_data[user]
    handle_inputs(inputs, user, 2028)
  };

  // Handle Inputs
  function handle_inputs(inputs, user, max_year) {
    inputs_series = refresh_charts(inputs, user, max_year)
    inputs_table(inputs, inputs_series, user, max_year)
  };

  // Capitalize First Letters Of A String
  function capitalize_first_letters(str) {
    return str.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1)
    });
  };

  // Calculate Net Worth
  function calculate_net_worth(inputs, inputs_series) {
    var total_current_amount = 0.0
    for (var input in inputs) { 
      value = inputs[input]["current_amount"] 
      total_current_amount += value
    };
    var total_future_amount = 0.0
    var max_date
    for (var dt in inputs_series["high_total"]) {
      if (inputs_series["high_total"][dt] > total_future_amount) { 
        total_future_amount = inputs_series["high_total"][dt] 
        max_date = dt
      };
    };
    var current_worth = document.getElementById("current_worth_value")
    current_worth.innerHTML = total_current_amount
    var future_worth = document.getElementById("future_worth_value")
    future_worth.innerHTML = String(total_future_amount).split('.')[0]
    var goal_year = document.getElementById("goal_year_value")
    goal_year.setAttribute("value", String(max_date).split('-')[0])
    goal_year.addEventListener("input", function (e) {
        handle_inputs(inputs, user, this.value)
    });
  };

  // Draw Inputs Table
  function inputs_table(inputs, inputs_series, user, max_year) {
    var links = {
      "BoA": "https://secure.bankofamerica.com/myaccounts/brain/redirect.go?target=accountsoverview&request_locale=en-us&source=add&fsd=y",
      "Marcus": "https://www.marcus.com/us/en/savings/your-savings/account-list",
      "Vanguard": "https://personal.vanguard.com/us/MyHome",
      "Crypto": "https://www.coinbase.com/charts"
    }
    var table = document.getElementById("inputs_table")
    while (table.firstChild) { table.removeChild(table.firstChild) };
    var cols = ["current_amount", "APR", "low_estimate_deposit", "high_estimate_deposit"]
    var adj_inputs = [""]
    for (var input in inputs) { adj_inputs.push(input) };
    for (i = 0; i < adj_inputs.length; i++) {
      var input = adj_inputs[i]
      var tr = document.createElement('tr')
      var td = document.createElement('td')
      var atag = document.createElement('a')
      if (input in links) { var href = links[input] }
      else { var href = "" } 
      atag.innerHTML = input
      atag.setAttribute("href", href)
      td.setAttribute("class", "inputs_table_td")
      td.appendChild(atag)
      tr.appendChild(td)
      for (j = 0; j < cols.length; j++) {
        var td = document.createElement('td')
        td.setAttribute("class", "inputs_table_td")
        if (input == "") { var value = capitalize_first_letters(cols[j].replace('_', ' ').replace('_', ' ')) }
        else { var value = inputs[input][cols[j]] }
        if (i == 0) { td.innerHTML = value }
        else {
          var form = document.createElement('input')
          form.setAttribute("class", "table_form")
          form.setAttribute("value", value)
          form.setAttribute("input", input)
          form.setAttribute("input_key", cols[j])
          form.addEventListener("input", function (e) {
              alter_input(inputs, e.target, this.value, max_year)
          });
          td.appendChild(form)
        }
        tr.appendChild(td)
      };
      table.appendChild(tr)
    };
    calculate_net_worth(inputs, inputs_series)
  };

  // User-Alterations To Inputs
  function alter_input(inputs, target, new_value, max_year) {
    var input = target.getAttribute("input")
    var input_key = target.getAttribute("input_key")
    inputs[input][input_key] = parseFloat(new_value)
    inputs_series = refresh_charts(inputs, user, max_year)
    calculate_net_worth(inputs, inputs_series)
  };

  // Refresh Chart
  function refresh_charts(inputs, user, max_year) {
    var inputs_series = {"low_total":{}, "high_total":{}}
    for (var input in inputs) {
      var deposit_types = ["low", "high"]
      for (d = 0; d < 2; d++) {
        var deposit_type = deposit_types[d]
        var series_name = deposit_type + '_' + input
        var total_name = deposit_type + '_total' 
        if ((inputs[input]["low_estimate_deposit"] == inputs[input]["high_estimate_deposit"]) && (deposit_type == "low")) { continue };
        inputs_series[series_name] = {}
        cur_value = inputs[input]["current_amount"]
        deposit = inputs[input][deposit_type + "_estimate_deposit"]
        var today = new Date();
        inputs[input]["monthly_rate"] = ((1+inputs[input]["APR"])**(1/12.0) - 1.0)
        for (i = 0; i < 100; i++) {  
          if (i > 0 && today.getFullYear()+i > max_year) { continue };
          var cur_date = (today.getFullYear()+i) + '-' + (today.getMonth()+1) +'-' + today.getDate();
          inputs_series[series_name][cur_date] = cur_value
          if (!(cur_date in inputs_series[total_name])) { inputs_series[total_name][cur_date] = 0.0 };
          inputs_series[total_name][cur_date] += cur_value
          for (j = 0; j < 12; j++) { 
            cur_value = (1.0 + inputs[input]["monthly_rate"]) * cur_value
            cur_value = cur_value + deposit
          };
        };
      };
    };
    refresh_chart_data(inputs_series, user)
    return inputs_series
  };

  // Refresh Chart Data
  function refresh_chart_data(inputs_series, user) {
    $.ajax({
      url: "http://66.228.40.96:5000/refreshfile/",
      type: "post",
      data: {series: inputs_series},
      success: function(response) {},
      error: function(xhr) {
        console.log('error');
      }
    });
    draw_charts(inputs_series, user)
  };

  // Draw Charts
  function draw_charts(inputs_series, user) {
    var graph_iframe = document.getElementById("inputs_line_chart");
    graph_iframe.setAttribute("user", user);
    graph_iframe.setAttribute("src", "/static/line_chart.html");
    graph_iframe.setAttribute("style", "height: 500px; width: 100%");
  };

  // Refresh Chart On Window Resizing
  window.onresize = function(event) {
    console.log('hi')
    draw_charts(inputs_series, user)
  };

});

//////////////
//  CHARTS  //
//////////////

google.charts.load('current', {'packages':['corechart']});

function drawBarChart(input_d, elem_id) {
  var data = google.visualization.arrayToDataTable(input_d);
  var view = new google.visualization.DataView(data);
  view.setColumns([0, 1,
                   {calc: "stringify",
                    sourceColumn: 1,
                    type: "string",
                    role: "annotation" },
                   2, 3]);
  var options = {
    title: "Topics",
    width: 200,
    height: 200,
    bar: {groupWidth: "95%"},
    legend: {position: "none"},
  };

  function selectHandler(e) {
    var presentations_list = document.getElementById('presentations_list');
    var selection = chart.getSelection()[0];
    if (selection) {
      var selected_category = data.getValue(selection.row, 3);
      states['broad_category_state'] = selected_category;
      $('.doc_view').remove();
      for (i = 0; i < presentation_aggs['views_documents'].length; i++) {
        var broad_categories = presentation_aggs['views_documents'][i]['attributes']['broad_categories'].value;
        broad_categories = broad_categories.split(' ');
        var broad_categories_dict = {}
        for (j = 0; j < broad_categories.length; j++) {
          broad_categories_dict[broad_categories[j]] = 1;
        }
        if (selected_category in broad_categories_dict) {
          presentations_list.appendChild(presentation_aggs['views_documents'][i]);
        }
      }
    }
    else {
      $('.doc_view').remove();
      for (i = 0; i < presentation_aggs['views_documents'].length; i++) {
        presentations_list.appendChild(presentation_aggs['views_documents'][i]);
      }
    }
  };

  var chart = new google.visualization.BarChart(document.getElementById(elem_id));
  google.visualization.events.addListener(chart, 'select', selectHandler);
  chart.draw(view, options);
};
