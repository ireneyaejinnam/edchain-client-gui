// modify the state representation of ipfs here

const log = require('electron-log');
const initialState = {
	// what is the initail state here?
	// what do i want to share?
	peerId: "",//config
	dataStorePath: "",//config
	gatewayAddress: "",//config
	apiAddress: "",
	logs: [],
	id: "",
	peers: 0,
	isOnline: false,
	status: ""
};


module.exports = function ipfs(state, action){
	
	if (!state){
		return initialState;
	}

	switch (action.type){
		case "logOutput":
			return Object.assign({}, state, { "logs": [ ...state.logs, action.payload ] });
		case "getId":
			return Object.assign({}, state, { "id": action.payload });
		case "isOnline":
			return Object.assign({}, state, { "isOnline": action.payload });
		case "getPeerId":
			return Object.assign({}, state, { "peerId": action.payload });
		case "getIPFSDatastorePath":
			return Object.assign({}, state, { "dataStorePath": action.payload });
		case "getIPFSAPIAddress":
			return Object.assign({}, state, { "apiAddress": action.payload });
		case "getIPFSGWAddr":
			return Object.assign({}, state, { "gatewayAddress": action.payload });
		case "checkStatus":
			return Object.assign({}, state, { "status": action.payload });
		case "ipfsSwarmPeers":
			return Object.assign({}, state, { "peers": action.payload });
		case "getLog":
			// fall through?
		case "start":
			// status
			// return Object.assign({}, state, { "id": action.payload });
		case "stop":
			// status
			// return Object.assign({}, state, { "id": action.payload });
		default:
			// log.info(action);
			return state;
	}

};

// var peerId = function(state, action){

// };

// var dataStorePath = function(state, action){

// };

// var gatewayAddress = function(state, action){

// };

// var apiAddress = function(state, action){

// };

// var logs = function(state, action){
// 	return [ ...state, action.payload ];
// };

// var id = function(state, action){

// };

// var peers = function(state, action){

// };

// var isOnline = function(state, action){

// };
