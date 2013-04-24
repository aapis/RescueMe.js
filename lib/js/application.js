var EventManager = function(){
	return this.init();
}

EventManager.prototype = {
	constructor: EventManager,

	init: function(){

	},

	bind: function(element, type, handler){
		if (element.addEventListener){ //Everyone else
			element.addEventListener(type, handler); 
		} else if (element.attachEvent){ //IE
			element.attachEvent('on'+type, handler);
		}

		return element;
	},
};

var Todo = function(){
	return this.init();
};

Todo.prototype = {
	constructor: Todo,
	EVM: null,
	TM: null,
	queue: [],

	init: function(){
		this.EVM = new EventManager();
		this._setListeners(this);
		this._setInitalData();
	},

	_setListeners: function(context){
		this.EVM.bind(document.querySelector('#new-todo'), 'keyup', function(evt){
			if(evt.which === 13){
				context.add({
					text: evt.srcElement.value,
					srcElement: evt.srcElement,
				});
			}
		});
	},

	_setInitalData: function(){
		var data = JSON.parse(this.IO.query('list'));

		for(var i = 0; i < data.length; i++){
			this.add({
				text: data[i],
				srcElement: null,
			});
		}
	},

	edit: function(original_text){

	},

	add: function(data){
		var output = document.createElement('li'),
			target = document.querySelector('#todo-list');
			
		output.innerHTML = data.text + '<span class="close pull-right" href="#">&times;</span>';
		//output.contentEditable = true; //disabled temporarily
		this.EVM.bind(output.querySelector('span'), 'click', function(evt){
			evt.preventDefault();

			this.parentElement.parentElement.removeChild(this.parentElement); //only removes from DOM
		});

		if(data.srcElement)
			data.srcElement.value = '';
			
		this.queue.push(data.text);

		this.IO.store('list', this.queue);

		return target.appendChild(output);
	},

	IO: {
		/*
		 * Get the data from the local client
		 *
		 * @since 1.0.0
		 */
		query: function(item){
			if(item)
				return localStorage.getItem('Todo.'+ item);	
		},

		/*
		 * Set data to the local client
		 *
		 * @since 1.0.0
		 */
		store: function(item, data){
			if(item)
				return localStorage.setItem('Todo.'+ item, JSON.stringify(data));
		},
	},
};

/**
 * [detect Instantiate Detect.js]
 * @type {Detect}
 */
var detect = new Detect({
	installPluginUtility: false,
});

window.onload = function(){
	var App = new Todo();
}