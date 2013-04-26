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
	queue: {
		tasks: [],
		lists: [],
	},
	patterns: {
		lists: new RegExp(/(l|list)\:/),
	},

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
		var data = {
			tasks: JSON.parse(this.IO.query('tasks')) || [],
			lists: JSON.parse(this.IO.query('lists')) || [],
		}

		if(data.tasks){
			for(var i = 0; i < data.tasks.length; i++){
				this.add({
					text: data.tasks[i],
					srcElement: null,
					buffer: context,
				}, true);
			}
		}

		if(data.lists){
			for(var i = 0; i < data.lists.length; i++){
				//add items to the todo list
				this.add({
					text: data.lists[i],
					srcElement: null,
					buffer: context,
				}, true);

				//auto add links to navigation
				this.addNavItem({
					text: data.lists[i],
					srcElement: null,
					buffer: context,
				})
			}
		}
	},

	edit: function(original_text){

	},

	add: function(data, pass){
		var output = document.createElement('li'),
			target = document.querySelector('#todo-list');

		output.innerHTML = data.text + '<span class="close pull-right" href="#">&times;</span>';
		//output.contentEditable = true; //disabled temporarily

		//delete an item control
		this.EVM.bind(output.querySelector('span'), 'click', function(evt){
			evt.preventDefault();

			for(var i = 0, messages = data.buffer.queue.tasks; i < messages.length; i++){
				if(data.text == messages[i]){
					messages.splice(i, 1);

					this.parentElement.parentElement.removeChild(this.parentElement);
				}
			}

			data.buffer.IO.store('tasks', messages);
		});

		//reset the value of the input box
		if(data.srcElement)
			data.srcElement.value = '';

		//task queue
		if(!this.patterns.lists.test(data.text)){ //test to see if it is a list
			this.queue.tasks.push(data.text);
		}else {
			//list queue
			if(this.patterns.lists.test(data.text))
				this.queue.lists.push(data.text.replace(this.patterns.lists, ''));
		}

		//save data
		if(!pass){
			this.IO.store('tasks', this.queue.tasks);
			this.IO.store('lists', this.queue.lists);
		}

		return target.appendChild(output);
	},

	addNavItem: function(data){

	},

	IO: {
		/*
		 * Get the data from the local client
		 *
		 * @since 1.0.0
		 */
		query: function(item){
			return localStorage.getItem('Todo.'+ item);	
		},

		/*
		 * Set data to the local client
		 *
		 * @since 1.0.0
		 */
		store: function(item, data){
			//console.log(item, data);
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