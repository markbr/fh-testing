function validateURL(url) {
	var urlRegxp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
	return urlRegxp.test(url);
}


//Slide out list containing a list of rss feeds
enyo.kind({
	name: "App",
	kind: enyo.Control, 
	value: 100, 
	max: 100, 
	unit: "%", 
	components: [
		{
			name: "error",
			kind: "onyx.Popup",
			centered: true,
			floating: true,
			classes: "big",
			content: ""
		},
		{
			name: "loading",
			kind: "onyx.Popup",
			centered: true,
			floating: true,
			classes: "loading",
			components: [
				{
					tag: "div",
					classes: "enyo-rotating-image enyo-spinner-large"
				}
			]
		},
		{
			kind: "onyx.Toolbar",
			components: [
			 	{
					kind: "onyx.InputDecorator",
					components: [
						{
							kind: "onyx.Input", 
							placeholder: "App Url",
							name: "urlInput"
						}
					]
				},
				{
					kind: "onyx.Button",
					content: "Load App",
					ontap: "loadApp",
					name: "loadBtn"
				}
			]
		},
		{
			kind: "enyo.Scroller",
			classes: "history-list",
			name: "historyList"
		}

	],
	history: [],
	create: function() {
		this.inherited(arguments);
		var app = this;

		$fh.data({
			key: "history"
		}, function(res) {
			if(res.val) {
				console.log(res.val);
				app.loadHistory(JSON.parse(res.val));
			}
			else {
				app.loadHistory([]);
			}
		},function() {
			app.loadHistory([]);
		});
	},
	loadHistory: function(history) {
		for(var i = 0, il = history.length; i < il; i++) {
			this.addHistoryItem(history[i], true);
		}
	},
	addHistoryItem: function(value, noSave) {

		//only add history item if they are valid urls
		if(this.history.indexOf(value) < 0) {

			this.history.push(value);
			!noSave && this.saveHistory();

			this.createComponent({
				kind: enyo.Control,
				ontap: "loadApp",
				container: this.$.historyList,
				url: value,
				classes: "item",
				components:[
					{
						content: value,
						classes: "link"
					},
					//remove button
					{
						kind: "onyx.Icon", 
						src: "img/remove-button.png",
						ontap: "removeHistoryItem"
					}
				]
			}).render();
			!this.$.historyList.rendered && this.$.historyList.render();
		}
	},
	//save the list of urls to local storage
	saveHistory: function() {
		$fh.data({
			act: "save",
			key: "history",
			val: JSON.stringify(this.history)
		});
	},
	loadApp: function(sender, event) {
		var url = "";
		if(sender === this.$.loadBtn) {
			url = "http://" + this.$.urlInput.hasNode().value + "/client/default/?device";
			this.$.urlInput.hasNode().blur();
		}
		else {
			url = sender.url;
		}

		this.addHistoryItem(url, false);


		navigator.app.clearCache();
		navigator.app.loadUrl(url, { wait: 2000, loadingDialog: "Loading App", loadUrlTimeoutValue: 60000 });

		this.$.loading.show();
	},
	//click event for close the remove history button
	removeHistoryItem: function(sender, event) {
		event.srcEvent.stopPropagation();

		var historyItem = sender.container.link,
			history = this.history;

		//remove the feed from the list of fields
		history.splice(history.indexOf(historyItem), 1);
		//save the list to localstorage
		this.saveHistory();
		//remove the list from the 
		this.removeControl(sender.container);
		sender.container.destroy();

		this.$.historyList.render();

	}
});