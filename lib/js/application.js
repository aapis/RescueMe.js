var EventManager = function(){
	return this.init();
}

EventManager.prototype = {
	constructor: EventManager,

	init: function(){

	},

	bind: function(element, type, handler){
		if(!element.length){
			if (element.addEventListener){ //Everyone else
				element.addEventListener(type, handler); 
			} else if (element.attachEvent){ //IE
				element.attachEvent('on'+type, handler);
			}
		}else { //is array
			for(var i = 0; i < element.length; i++){
				if (element[i].addEventListener){ //Everyone else
					element[i].addEventListener(type, handler); 
				} else if (element[i].attachEvent){ //IE
					element[i].attachEvent('on'+type, handler);
				}
			}
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
		this._setInitalData(this);
		this._setListeners(this);
	},

	_setListeners: function(context){
		this.EVM.bind(document.querySelector('.new'), 'keyup', function(evt){
			if(evt.which === 13 && evt.srcElement.value.length > 0){
				context.add({
					text: evt.srcElement.value,
					srcElement: evt.srcElement,
					buffer: context,
				});
			}
		});

		this.EVM.bind(document.querySelectorAll('#todo-list li'), 'click', function(evt){
			if(evt.target.classList.contains('done') && evt.target.classList.length > 0){
				evt.target.classList.remove('done');
			}else {
				evt.target.classList.add('done');
			}
		});

		this.EVM.bind(document.querySelector('#check-all'), 'click', function(){
			var doDelete = confirm('Are you sure?'),
				list = document.querySelector('#todo-list');

			if(doDelete){
				list.innerHTML = '';
				localStorage.clear();

				this.checked = false;
			}
		});
	},

	_setInitalData: function(context){
		var data = JSON.parse(this.IO.query('list'));

		if(data){
			for(var i = 0; i < data.length; i++){
				this.add({
					text: data[i],
					srcElement: null,
					buffer: context,
				});
			}
		}
	},

	edit: function(original_text){

	},

	add: function(data){
		var output = document.createElement('li'),
			target = document.querySelector('#todo-list');

		output.innerHTML = data.text + '<span class="close pull-right" href="#">&times;</span>';
		//output.contentEditable = true; //disabled temporarily

		//delete an item control
		this.EVM.bind(output.querySelector('span'), 'click', function(evt){
			evt.preventDefault();

			for(var i = 0, messages = data.buffer.queue; i < messages.length; i++){
				if(data.text == messages[i]){
					messages.splice(i, 1);

					this.parentElement.parentElement.removeChild(this.parentElement);
				}
			}

			data.buffer.IO.store('list', messages);
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