import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import _ from 'lodash';

import facts_raw from './facts_small.json';


const Base64 = (function () {
    var digitsStr = 
    //   0       8       16      24      32      40      48      56     63
    //   v       v       v       v       v       v       v       v      v
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
    var digits = digitsStr.split('');
    var digitsMap = {};
    for (var i = 0; i < digits.length; i++) {
        digitsMap[digits[i]] = i;
    }
    return {
        encode: function(int32) {
            var result = '';
            while (true) {
                result = digits[int32 & 0x3f] + result;
                int32 >>>= 6;
                if (int32 === 0)
                    break;
            }
            return result;
        },
        decode: function(digitsStr) {
            var result = 0;
            var digits = digitsStr.split('');
            for (var i = 0; i < digits.length; i++) {
                result = (result << 6) + digitsMap[digits[i]];
            }
            return result;
        }
    };
})();



const dims = {'GAME': {name: 'Game', index: 0}, 'SET': {name: 'Set', index: 1}, 'PLAYER': {name: 'Player', index: 2}};


// const facts = [];


const dim_count = 6;
const msr_count = 9;

const dim_val_ids = {
  'game': [new Map(), new Map(), 1],
  'set': [new Map(), new Map(), 1],
  'team': [new Map(), new Map(), 1],
  'player': [new Map(), new Map(), 1],
  'score_gap': [new Map(), new Map(), 1],
  'serve_streak': [new Map(), new Map(), 1]
};

// function dim_id_to_val(dim, val)

function dim_val_id(dim, val) {
  const [to_id, from_id, next_id] = dim_val_ids[dim];
  if (to_id.has(val)) {
    return to_id.get(val);
  } else {
    to_id.set(val, next_id);
    from_id.set(next_id, val);
    dim_val_ids[dim][2] = next_id + 1;
    return next_id;
  }
}


function insert_dim(dim_arr, dim, val) {
  const dim_to_index = {'game': 0, 'set': 1, 'team': 2, 'player': 3, 'score_gap': 4, 'serve_streak': 5};
  dim_arr[dim_to_index[dim]] = dim_val_id(dim, val);
}


const facts = facts_raw.map((dims_msrs) => {
  let [dims, msrs] = dims_msrs;

  const dim_arr = _.fill(Array(dim_count), null);
  dims.forEach((dim_val) => {
    const [dim, val] = dim_val;
    insert_dim(dim_arr, dim, val);
  });

  const msr_to_index = {
    'sets_player': 0, 
    'kill': 1, 
    'total_serves': 2, 
    'points': 3, 
    'kill_attempt': 4, 
    'attack_error': 5,
    'digs': 6,
    'service_ace': 7,
    'reception_error': 8
  };

  const msr_arr = _.fill(Array(msr_count), null);
  Object.keys(msrs).forEach((msr) => {
    // const val = msrs[msr];
    msr_arr[msr_to_index[msr]] = msrs[msr];
  });

  return [dim_arr, msr_arr];
});

console.log(facts);

// const facts = [
//     [[1,2,555], ['gameid',2,'Player Name']],
//     [[1,2,9], ['gameid 2',3,'Player Name 2']]
//   ];


function dimHash(dims) { 
  return dims.map((v) => {
    if (v) {
      return `${Base64.encode(v)}`; 
    } else {
      return '?';
    }
  }).join(',');
}

function dimUnhash(hash) { 
  return hash.split(',').map((v) => {
    if (v == '?') {
      return null;
    } else {
      return Base64.decode(v);
    }
  });
}

const fact_table = new Map([]);
facts.forEach((row) => fact_table.set(dimHash(row[0]), row[1]));

console.log(fact_table);

// headers = ['game', 'set', 'player', 'kills'];
// rows = [['gameid', '1', 'K B', '1']];


class FactsComponent extends Component {
  constructor(props) {
    super(props);
    this.addSelection = this.addSelection.bind(this);
    this.removeSelection = this.removeSelection.bind(this);

    this.state = {dims: props.dimensions, selected_dims: [], body: []};
  }

  addSelection(dim_id) {
    // this.setState({dims: []})
    this.setState((prev_state) => { 
      // const new_dims = prev_state.selected_dims.slice();
      const new_dims = _.union(prev_state.selected_dims, [dim_id]);
      // new_dims.push(dim_id)
      return {selected_dims: new_dims};
    });
  }

  removeSelection(dim_id) {
    this.setState((prev_state) => { 
      // const new_dims = prev_state.selected_dims.slice();
      const new_dims = _.difference(prev_state.selected_dims, [dim_id]);
      return {selected_dims: new_dims};
    });
  }

  render() {

    let headers = this.state.selected_dims.map((id) => this.state.dims[id].name);
    headers = _.concat(headers, ['Kills', 'Serves']);
    

    const dims = Object.keys(this.state.selected_dims);

    const table_data = [];
    for (const fact of fact_table) {
      console.log(fact);
      const dim_vals = dimUnhash(fact[0]).map((dim_val_id) => dim_val_id);

      const row = _.concat(dim_vals, fact[1]);

      table_data.push(row);
    }

    console.log(table_data);

    return (
      <div>
        <DimensionSelector dimensions={this.state.dims} addSelection={this.addSelection} removeSelection={this.removeSelection} />
        <FactsTable dimensions={dims} headers={headers} body={table_data} />
      </div>
    );
  }


}



class DimensionItem extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = {selected: props.selected};
  }

  handleClick(e) {
    const checkbox = e.target.querySelector("input");
    const is_checked = checkbox.checked;

    if (is_checked) {
      checkbox.checked = false;
      this.props.removeSelection(e.target.getAttribute("data"));
    } else {
      checkbox.checked = true;
      this.props.addSelection(e.target.getAttribute("data"));
    }
  }

  render() {
    return (
      <li style={{textAlign: 'left', userSelect: 'none', cursor: 'pointer'}} onClick={this.handleClick} key={this.props.id} data={this.props.id}>
        <input type="checkbox" />
        {this.props.name}
      </li>
    );
  }

}



function DimensionSelector(props) {
  // const addSelection = props.addSelection;
  // const removeSelection = props.removeSelection;
  const dims = props.dimensions
  const dim_items = Object.keys(dims).map((id) => {
    return <DimensionItem id={id} name={dims[id].name} addSelection={props.addSelection} removeSelection={props.removeSelection} />
  });

  return (
    <ul style={{listStyle: 'none', paddingLeft: 0}}>
      {dim_items}
    </ul>
  );
}


function FactsTable(props) {
  // const headers = ['a', 'b', 'c'];

  const header_row = props.headers.map((h) => <th>{h}</th>);

  const facts_rows = props.body.map((r) => {
    return <tr>{r.map((d) => <td>{d}</td>)}</tr>;
  });

  return (
    <table className='FactsTable'>
      <thead>
        <tr>{header_row}</tr>
      </thead>
      <tbody>
        {facts_rows}
      </tbody>
    </table>
  );
}


class PlayGraph extends Component {

  constructor(props) {
    super(props);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);


    const pr_graph = this.generateProbabilityGraph({A: 0.5, B: 0.5});

    this.state = {popup: null, probability_graph: pr_graph, team_so: {A: 0.5, B: 0.5}};
  }
  
  onMouseOver(e) {
    // console.log(e.target.getAttribute("data"));
    const data = e.target.getAttribute("data");
    const data_arr = data.split(",");
    this.setState({popup: data_arr});
  }

  onMouseOut(e) {
    // console.log(e.target.getAttribute("data"));
    this.setState({popup: null});
  }

  onInputChange(e, team) {
    console.log(e.target);
    const new_val = e.target.value;

    if (new_val != "") {
      const val = Number(new_val);

      if (this.state.team_so[team] != val) {
        this.setState(function(prev_state, props) {
          var prev_so = prev_state.team_so;
          prev_so[team] = new_val;
          
          const pr_graph = this.generateProbabilityGraph(prev_so);
          
          return {probability_graph: pr_graph, team_so: prev_so};
        });


      }

    }

  }

  generateProbabilityGraph(team_so) {
    const vertices = [];
    for (var i = 0; i < 100; i++) {
      vertices[i] = _.fill(Array(100), [0, 0]);
    }
    vertices[0][0] = [1, 0, 1];  // X axis team served first

    const y_team_so = team_so['A'];
    const x_team_so = team_so['B'];

    const pr_up_up = y_team_so;  // Probability y axis team wins point on their own serve
    const pr_up_right = 1 - pr_up_up;

    const pr_right_right = x_team_so;  // Probability x axis team wins point their own serve
    const pr_right_up = 1 - pr_right_right;

    // Assume x axis serves first.
    vertices[0][1] = [pr_right_right, 0, pr_right_right];
    vertices[1][0] = [0, pr_right_up, pr_right_up];

    // hoz_edges[0][0] = pr_right_right;
    // vert_edges[0][0] = pr_right_up;

    const x_wins = [];
    const y_wins = [];

    for (var i = 2; i < 70; i++) {  // y-axis
      for (var j = 0; j <= i; j++) {  // x-axis
        // x = j
        // y = i - j
        
        const x = j;
        const y = i - j;

        if (x > 25 && Math.abs(x - y) > 2) {
          continue;
        }
        if (y > 25 && Math.abs(x - y) > 2) {
          continue;
        }
    
        const pr_uu = y - 2 < 0 ? 0 : vertices[y - 1][x][1] * pr_up_up;
        const pr_ur = x - 1 < 0 || y - 1 < 0 ? 0 : vertices[y][x - 1][1] * pr_up_right;
        const pr_ru = x - 1 < 0 || y - 1 < 0 ? 0 : vertices[y - 1][x][0] * pr_right_up;
        const pr_rr = x - 2 < 0 ? 0 : vertices[y][x - 1][0] * pr_right_right;

        const pr = pr_uu + pr_ur + pr_ru + pr_rr;

        if (x >= 25 && x > y && Math.abs(x - y) >= 2) {
          vertices[i - j][j] = [0, 0, pr_uu + pr_ur + pr_ru + pr_rr]
          x_wins.push([x, y, pr_uu + pr_ur + pr_ru + pr_rr]);
        } else if (y >= 25 && y > x && Math.abs(x - y) >= 2) {
          vertices[i - j][j] = [0, 0, pr_uu + pr_ur + pr_ru + pr_rr]
          y_wins.push([x, y, pr_uu + pr_ur + pr_ru + pr_rr]);
        } else {
          vertices[i - j][j] = [pr_rr + pr_ur, pr_uu + pr_ru, pr_uu + pr_ur + pr_ru + pr_rr];

          console.log(`Pr(${j},${i-j})=${pr}`)
        }

        // vertices[i - j][j] = hoz_edges[j - 1][i - j - 1]

        // const pr = 0;
      }
    }

    // var x_sum = 0;
    // for (var i = 0; i < 50; i++) {
    //   const ftw = Math.max(i - 2, 25);  // Points needed to win
    //   x_sum += vertices[i][ftw][0] + vertices[i][ftw][1];
    // }

    const pr_x_win = x_wins.reduce((acc, arr) => acc + arr[2], 0);
    const pr_y_win = y_wins.reduce((acc, arr) => acc + arr[2], 0);

    // console.log("X wins:", x_wins);
    // console.log("Y wins:", y_wins);

    console.log(`X wins: ${pr_x_win}, Y wins: ${pr_y_win}`);

    return vertices;
  }

  render() {

    const rows = [];

    const height = 30;
    const width = 30;

    for (var i = 0; i < height+1; i++) {
      const cols = [];

      cols[0] = <td className="pg-y-axis-label"><div>{height-i}</div></td>;
        
      const y = height+1-i;

      // var max = this.state.probability_graph[y-1][0][2]

      const max_in_row = _.maxBy(this.state.probability_graph[y-1], (o) => o[2])[2];
      console.log("max_in_row", max_in_row)

      for (var j = 1; j < width+1; j++) {
        // cols[j] = <td><div className="pg-hover" data={[j,26-i]} onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut}></div></td>;
        
        const x = j;

        // console.log(this.state.probability_graph[y-1][x-1][2]);

        if (this.state.probability_graph[y-1][x-1][2]) {
          const percent = this.state.probability_graph[y-1][x-1][2];

          const label = `${_.round(percent * 100, 0)}%`;
          // const label = `${_.round(this.state.probability_graph[y-1][x-1][0] + this.state.probability_graph[y-1][x-1][1] * 100, 1)}%`;
              // <div className="pg-hover" data={[j,26-i]} onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut}></div>

          
          const color_1 = [200, 0, 10];
          const color_2 = [10, 210, 10];

          var color = [0, 0, 0];

          // if (percent == max_in_row) {
            // color = [0, 255, 0];
          // }

          const color = [color_1[0] + (color_2[0] - color_1[0]) * percent/max_in_row, 
                        color_1[1] + (color_2[1] - color_1[1]) * percent/max_in_row,
                        color_1[2] + (color_2[2] - color_1[2]) * percent/max_in_row];
          const color_str = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

          var visible = "visible";

          if (percent < 0.0025) {
            visible = "hidden";
          }


          cols[j] = (
            <td>
              <div className="pg-vertex-label font-11" style={{color: color_str, fontWeight: 'bold', visibility: visible}}>{label}</div>
            </td>
          );
        } else {
          
          // out of bounds

          cols[j] = (
            <td>
              <div style={{color: "rgb(150,150,150)"}}>-</div>
            </td>
          );

        }

        // cols[j] = <td>{`${j},${25-i}`}</td>;
      }

      rows[i] = cols;
    }

    const cols = [];

    for (var i = 0; i < width+1; i++) {
      cols[i] = <td className="pg-x-axis-label"><div>{i}</div></td>;
    }

    rows[width+1] = cols;

    // const path = [0,0,1,1,0,0,1,1,0,0,0,1,0,0,1];
    
    var x = 0;
    var y = 0;

    // for (let p of path) {
    //   if (p == 0) {
    //     x++;
    //     rows[25-y][x] = <td className="pg-path-bottom">&nbsp;</td>
    //   } else {
    //     y++;
    //     rows[26-y][x+1] = <td className="pg-path-left">&nbsp;</td>;
    //   }
    //   // rows[25-y][x] = <td class="pg-path-left">&nbsp;</td>;
    // }


    // console.log(`Probability of x axis team winning: ${x_sum}`);

    // console.log(rows[24])

    const tr_rows = rows.map((cols) => <tr>{cols}</tr>);

    var pos_left = 0;
    var pos_bot = 0;

    var visible = "hidden";
    var label = "";

    // if (this.state.popup) {
    //   const [x, y] = this.state.popup;
    //   // console.log(`set x,y: ${[x,y]}`);
    //   pos_left = x * 27.1 + 4;
    //   pos_bot = y * 27.1 - 1;
    //   visible = "visible";
      
    //   if (this.state.probability_graph[y-1]) {
    //     label = `${_.round(this.state.probability_graph[y-1][x-1][0] + this.state.probability_graph[y-1][x-1][1] * 100, 1)}%`;
    //   }
    // }
  
    return (
      <div style={{position: "relative"}}>
        <input placeholder="Team A S/O" type="number" min="0" max="1" onChange={(e) => this.onInputChange(e, 'A')}></input>
        <input placeholder="Team B S/O" onChange={(e) => this.onInputChange(e, 'B')}></input>
        <div className="pg-hover-item" style={{visibility: visible, position: "absolute", left: pos_left, bottom: pos_bot}}>
          {label}
          <div className="pg-hover-inner"></div>
        </div>
        <table className='PlayGraph'>
          <tbody>
          {tr_rows}
          </tbody>
        </table>
      </div>
    );
  }
}


class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save.
        </p>
        <FactsComponent dimensions={dims}/>
        <PlayGraph data={[0,1,1,0,1,0,1]} />
      </div>
    );
  }
}

export default App;
