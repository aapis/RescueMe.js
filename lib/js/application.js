/**
 * GENERAL TODOS:
 *
 * - Settings pane (a la Facebook's iOS app)
 * - server sync (settings page contains an "API URL" field, Todo uses this to sync to a server)
 * - general refactoring
 * - custom colour generator
 * - edit list functionality
 */

var EventManager = function(){
	return this.init();
}

EventManager.prototype = {
	constructor: EventManager,

	init: function(){
		//focus the new task input box on load
		document.querySelector('.new').focus();
	},

	bind: function(element, type, handler){
		if(element){
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
		}

		return false;
	},
};

var Todo = function(){
	return this.init();
};

/**
 * [prototype description]
 * TODO: tasks should be objects so we can define a parent (list)
 * TODO: types: lists, completed, in progress
 * @type {Object}
 */
Todo.prototype = {
	constructor: Todo,
	EVM: null,
	TM: null,
	queue: {
		tasks: [],
		lists: [],
	},
	patterns: {
		lists: new RegExp(/^(l|nl|list)\:/),
		add_to_list: new RegExp(/(al|addToList)\:/),
		edit_list: new RegExp(/(el|editList)\:/),
		edit_task: new RegExp(/(et|edit)\:/),
		first_integer: new RegExp(/^\d/),
	},

	//input: null,

	init: function(){
		this.EVM = new EventManager();
		this._setInitalData(this);
		this._setListeners(this);
	},

	_setListeners: function(context){
		this.EVM.bind(document.querySelector('.new'), 'keyup', function(evt){
			evt.preventDefault();

			var inputVal = evt.srcElement.value;
				//context.input = context.parse(inputVal); //inputVal temp for now

			if(evt.which === 13 && inputVal.length > 0){
				//editing a task
				if(context.patterns.edit_task.test(inputVal)){
					return context.edit_task(inputVal);
				}

				//adding new lists/tasks
				if(context.patterns.lists.test(inputVal)){ //lists
					context.add_list({
						text: inputVal,
						srcElement: evt.srcElement,
						parent: context,
					});
				}else { //tasks
					context.add({
						text: inputVal,
						srcElement: evt.srcElement,
						parent: context,
						isChild: !!context.patterns.add_to_list.test(inputVal),
					});
				}

			}
		});

		this.EVM.bind(document.querySelector('#check-all'), 'click', function(){
			if(!this.classList.contains('disabled')){
				var doDelete = confirm('Are you sure?'),
					list = document.querySelector('#todo-list'),
					lists_list = document.querySelector('.lists-list');

				if(doDelete){
					list.innerHTML = '';
					lists_list.innerHTML = '';

					localStorage.clear();

					//hide "remove all" button
					document.querySelector('#check-all').classList.add('disabled');
				}
			}
		});

		//export functionality
		this.EVM.bind(document.querySelector('.export'), 'click', function(){
			var json = JSON.stringify(context.queue);

			return console.log(json);
		});

		//settings pane functionality
		this.EVM.bind(document.querySelector('.settings'), 'click', function(){

		});
	},

	_setInitalData: function(context){
		var data = {
				tasks: JSON.parse(this.IO.query('tasks')) || [],
				lists: JSON.parse(this.IO.query('lists')) || [],
			},
			resetBtn = document.querySelector('.reset');

		//hide the reset button
		resetBtn.style.display = 'none';

		if(data.tasks){
			//hide "remove all" button
			document.querySelector('#check-all').classList.add('disabled');

			for(var i = 0; i < data.tasks.length; i++){
				this.add({
					text: data.tasks[i],
					srcElement: null,
					parent: context,
					isChild: !!context.patterns.add_to_list.test(data.tasks[i]),
				}, true);
			}
		}

		if(data.lists){
			for(var i = 0; i < data.lists.length; i++){
				//auto add links to navigation
				this.add_list({
					text: data.lists[i],
					srcElement: null,
					parent: context,
				});
			}
		}

		//static complete list functionality
		//TODO: refactor to support both complete and in_progress
		this.EVM.bind(document.querySelector('#complete'), 'click', function(){
			var elsToHide = document.querySelectorAll('#todo-list li:not(.complete)');

			//show the reset button
			document.querySelector('.reset').style.display = 'inline-block';

			for(var i = 0; i < elsToHide.length; i++){
				elsToHide[i].style.display = 'none';
			}
		});

		//static in_progress list functionality
		this.EVM.bind(document.querySelector('#in_progress'), 'click', function(){
			var elsToHide = document.querySelectorAll('#todo-list li:not(.in_progress)');

			//show the reset button
			document.querySelector('.reset').style.display = 'inline-block';

			for(var i = 0; i < elsToHide.length; i++){
				elsToHide[i].style.display = 'none';
			}
		});

		//static reset button functionality
		this.EVM.bind(resetBtn, 'click', function(evt){
			evt.preventDefault();

			for(var i = 0, elsToShow = document.querySelectorAll('#todo-list li'); i < elsToShow.length; i++){
				elsToShow[i].style.display = 'list-item';
			}

			this.style.display = 'none';
		});

		//delete an item control
		this.EVM.bind(document.querySelector('li>span'), 'click', function(evt){
			evt.preventDefault();
			//console.log(this);
			for(var i = 0, messages = data.parent.queue.tasks; i < messages.length; i++){
				if(data.text == messages[i]){
					messages.splice(i, 1);

					this.parentElement.parentElement.removeChild(this.parentElement);
				}
			}

			data.parent.IO.store('tasks', messages);
		});
	},

	parse: function(text){

	},

	slug: function(text){
		return this.escape(text.split(' ').join('_'));
	},

	edit_task: function(text){
		var index = parseInt(text.split(':')[1]) - 1, //1 based index
			el = document.querySelectorAll('#todo-list li')[index],
			initialText = el.innerText.substring(0, el.innerText.length-1);
		
		if(undefined !== el){ //in bounds
			text = this.escape(text);

			el.innerHTML = text + '<span class="close pull-right" href="#">&#x2713;</span>';

			//superfluous, potentially detrimental, but currently functional
			document.querySelector('.new').value = '';
			document.querySelector('.new').focus();

			//determine index of the associated item in this.queue.tasks
			for(var i = 0; i < this.queue.tasks.length; i++){
				if(initialText == this.queue.tasks[i]){
					this.queue.tasks[i] = text;
				}
			}

			this.IO.store('tasks', this.queue.tasks); //won't save this list, need to modify this.queue.tasks first
		}

		return false;
	},

	add: function(data, pass){
		var output = document.createElement('li'),
			target = document.querySelector('#todo-list'),
			text = '',
			parentClass = '';

		//show the "remove all" button
		document.querySelector('#check-all').classList.remove('disabled');

		//string replacements for lists and other types
		text = this.escape(data.text);

		if(data.isChild){
			//parentClass = data.text.explode
			var tmpText = text,
				list = tmpText.split(' ').splice(0, 1)[0];

			//if list not in this.queue.lists, be all wtf, placeholder for now
			//if(1==1){
				//remove list name from text, print output later
				text = tmpText.replace(list, '');
				
				//add the proper class(es)
				output.classList.add(list.replace(this.patterns.add_to_list, ''));
			//}
		}

		//setup the list element
		output.innerHTML = text + '<span class="close pull-right" href="#">&#x2713;</span>';
		//output.contentEditable = true; //disabled temporarily

		//delete an item control
		this.EVM.bind(output.querySelector('span'), 'click', function(evt){
			evt.preventDefault();
			//console.log(this.parentElement, this.parentElement.parentElement);return;
			for(var i = 0, messages = data.parent.queue.tasks; i < messages.length; i++){
				if(data.text == messages[i]){
					messages.splice(i, 1);

					if(this.parentElement.parentElement){
						this.parentElement.parentElement.removeChild(this.parentElement);
					}
				}
			}

			data.parent.IO.store('tasks', messages);
		});

		//reset the value of the input box
		if(data.srcElement)
			data.srcElement.value = '';

		//task queue
		this.queue.tasks.push(data.text);

		//save data
		if(!pass){
			this.IO.store('tasks', this.queue.tasks);
		}

		return (output.classList.contains('list') ? '' : target.appendChild(output)); //have to be rewritten for other types
	},

	escape: function(text){
		text = text.replace(this.patterns.add_to_list, '');
		text = text.replace(this.patterns.edit_list, '');
		text = text.replace(this.patterns.edit_task, '');
		text = text.replace(this.patterns.first_integer, '');
		text = text.replace(/(&#x2713|✓)/, '');

		return text;
	},

	add_list: function(data){
		var output = document.createElement('li'),
			target = document.querySelector('.lists-list'),
			text = '';

		text = data.text.replace(this.patterns.lists, '');

		//setup the list element
		output.innerHTML = '<a href="#">'+ text + '</a>';
		output.id = text;

		//reset the value of the input box
		if(data.srcElement)
			data.srcElement.value = '';

		this.EVM.bind(output.querySelector('a'), 'click', function(){
			data.parent.sortTasks(this);
		});

		this.queue.lists.push(text);

		this.IO.store('lists', this.queue.lists);

		return target.appendChild(output);
	},

	sortTasks: function(context){
		var parent = context.parentElement,
			elsToHide = document.querySelectorAll('#todo-list li:not(.'+ parent.id +')');

		//show the reset button
		document.querySelector('.reset').style.display = 'inline-block';

		for(var i = 0; i < elsToHide.length; i++){
			elsToHide[i].style.display = 'none';
		}
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