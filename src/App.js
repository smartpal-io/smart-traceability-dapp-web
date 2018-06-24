import React, { Component } from 'react'

import ProductRegistryContract from '../build/contracts/ProductRegistry.json'
import TraceableContract from '../build/contracts/Traceable.json'

import getWeb3 from './utils/getWeb3'

import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      history:[],
      inputProductId: '',
      inputProductAddress: '',
      inputPositionTimestamp: '',
      inputLatitudePosition: 0,
      inputLongitudePosition: 0,
      web3: null
    }

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  /**** VIEW *****/

  render() {

    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <h1>Product traceability</h1>
          <h2>Manage your traceability without servers.</h2>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              {this.renderFormProductManagement()}
              {this.renderFormHistoricalPositionManagement()}
              {this.renderTimeline()}
            </div>
          </div>
        </main>
      </div>
    );
  }

  renderFormProductManagement = () => {
    return <form onSubmit={this.handleSubmit}>
      <label>
        Product ID : &nbsp; <input type="text" name="inputProductId" value={this.state.inputProductId} onChange={this.handleProductInformationChange.bind(this)}/>
      </label>
      <label>
        Product Address : &nbsp;<input type="text" name="inputProductAddress" value={this.state.inputProductAddress}/>
      </label>
      <button onClick={this.addProductAction.bind(this)}>Add</button>
      <button onClick={this.findProductAction.bind(this)}>Find</button>
      <button onClick={this.findProductAction.bind(this)}>Reload timeline</button>
    </form>
  }

  renderFormHistoricalPositionManagement = () => {
    if(this.state.inputProductAddress!==null && this.state.inputProductAddress!==""){
      return <form onSubmit={this.handleSubmit}>
        <label>
          Add Position : &nbsp; <input type="date" name="inputPositionTimestamp" value={this.state.inputPositionTimestamp}
           onChange={this.handleHistoricalPositionChange.bind(this)}/>
        </label>
        <label>
          Latitude : &nbsp; <input type="number" step="any" name="inputLatitudePosition" value={this.state.inputLatitudePosition}
           onChange={this.handleHistoricalPositionChange.bind(this)}/>
        </label>
        <label>
          Longitude : &nbsp; <input type="number" name="inputLongitudePosition" step="any" value={this.state.inputLongitudePosition}
          onChange={this.handleHistoricalPositionChange.bind(this)}/>
        </label>
        <button onClick={this.addHistoricalPositionAction.bind(this)}>Save</button>
      </form>
    }
  }

  renderTimeline = () => {
    if(this.state.history.length>0){
      return <VerticalTimeline animate={ false }>
      {this.state.history.map(function (step) {
        return <VerticalTimelineElement
          className="vertical-timeline-element--work"
          key={Math.random()}
          iconStyle={{ background: 'rgb(33, 150, 243)', color: '#fff' }} >
          <h3 className="vertical-timeline-element-title">>Miami, FL</h3>
          <h4 className="vertical-timeline-element-subtitle">Date {new Date((step[0]*1000)).toString()}</h4>
          <p>
            Latitude : {step[1].toString()} , Longitude : {step[2].toString()}
          </p>
        </VerticalTimelineElement>
      })}
      </VerticalTimeline>
    };
  }

  /**** COMMON ACTION ****/

  handleSubmit(event) {
    event.preventDefault();
  }

  /**** PRODUCT INFORMATION ACTION ****/

  handleProductInformationChange(event) {
    this.setState({
      inputProductId: event.target.value,
      inputProductAddress: ""
    })
  }


  addProductAction(event) {
    var inputProductId = this.state.inputProductId;

    const contract = require('truffle-contract')
    const productRegistry = contract(ProductRegistryContract)
    productRegistry.setProvider(this.state.web3.currentProvider)

    var productRegistryInstance
    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      productRegistry.deployed().then((instance) => {
        productRegistryInstance = instance
        // add new product.
        return productRegistryInstance.addProduct(inputProductId, {from: accounts[0]})
      }).then((result) => {
        // Get the value from the contract to prove it worked.
        return productRegistryInstance.getProductAddress.call(inputProductId, accounts[0])
      }).then((result) => {
        // Update state with the result.
        return this.setState({ inputProductAddress: result })
      })
    })
  }

  findProductAction(event) {
    var inputProductId = this.state.inputProductId;

    const contract = require('truffle-contract')
    const productRegistry = contract(ProductRegistryContract)
    productRegistry.setProvider(this.state.web3.currentProvider)

    productRegistry.deployed().then((instance) => {
      // Get the product from the contract.
      return instance.getProductAddress.call(inputProductId)
    }).then((result) => {
      // Update state with the result.
      this.setState({ inputProductAddress: result })
      this.displayTimeline()
    })
  }


  /****** HISTORICAL POSITION ACTION *******/
  handleHistoricalPositionChange(event) {

    const name = event.target.name;
    this.setState({
      [name]: event.target.value
    })
  }


  addHistoricalPositionAction(event) {
    var traceableAddress = this.state.inputProductAddress;

    const contract = require('truffle-contract')
    const traceable = contract(TraceableContract)
    traceable.setProvider(this.state.web3.currentProvider)

    var traceableInstance
    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      traceable.at(traceableAddress).then((instance) => {
        traceableInstance = instance
        // add new product.

        var timestamp = new Date(this.state.inputPositionTimestamp).getTime()/1000;
        var latitude = this.state.inputLatitudePosition*1000000;
        var longitude = this.state.inputLongitudePosition*1000000;
        return traceableInstance.addStep(timestamp,latitude,longitude, {from: accounts[0]})
      })
    })
  }

  displayTimeline() {

    this.state.history = []

    var traceableAddress = this.state.inputProductAddress;

    const contract = require('truffle-contract')
    const traceable = contract(TraceableContract)
    traceable.setProvider(this.state.web3.currentProvider)

    var traceableInstance

    traceable.at(traceableAddress).then((instance) => {
      traceableInstance = instance
      // Get number of steps.
      return traceableInstance.getStepsCount.call()
    }).then((result) => {
      // Update timeline with the result.
      for (var i = 0; i < result; i++) {
        traceableInstance.getStep.call(i).then((step) => {
          // Update timeline with the result.
          var prevState = this.state;
          this.setState((prevState) => { history: prevState.history.push(step) })
        })
      }
    })
  }


}

export default App
