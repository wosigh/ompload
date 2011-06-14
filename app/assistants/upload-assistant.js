function UploadAssistant() {
	
	this.filePickModel = {
  		label : "Pick File",
  		disabled: false
	}
	
	this.fileUploadModel = {
  		label : "Ompload!",
  		disabled: true
	}
	
	this.randomSub = 
	[
		{weight: 1, text: 'powered by 260 retarded Skones'},
		{weight: 1, text: 'powered by 265 brazilian kiwis'},
		{weight: 1, text: 'powered by 211 christian nerds'},
		{weight: 1, text: 'powered by 250 happy baby seals'},
		{weight: 1, text: 'powered by 458 zombie gerbils'},
		{weight: 1, text: 'powered by 356 ugly honey badgers'}
	]
	
	this.idRegExp = new RegExp(/View file: <a href="v([A-Za-z0-9+\/]+)">/)
	
	this.processing = false
	
}

UploadAssistant.prototype.setup = function() {
	
	this.controller.setupWidget("buttonPick", {}, this.filePickModel)
	this.controller.setupWidget("buttonUpload", {type: Mojo.Widget.activityButton}, this.fileUploadModel)
	
	this.controller.setupWidget(
		'file',
		{
			multiline: true,
			enterSubmits: false,
			changeOnKeyPress: true,
			textCase: Mojo.Widget.steModeLowerCase,
			focusMode: Mojo.Widget.focusSelectMode
		},
		{
			value: ''
		}
	);
	
	this.versionElement = this.controller.get('version')
	this.subTitleElement = this.controller.get('subTitle')
	this.fileElement = this.controller.get('file')
	this.urlElement = this.controller.get('ompldrURL')
	
	this.versionElement.innerHTML = "v" + Mojo.Controller.appInfo.version;
	this.subTitleElement.innerHTML = this.getRandomSubTitle()
	
	Mojo.Event.listen(this.controller.get("buttonPick"), Mojo.Event.tap, this.pickFile.bindAsEventListener(this))
	Mojo.Event.listen(this.controller.get("buttonUpload"), Mojo.Event.tap, this.uploadFile.bindAsEventListener(this))
	Mojo.Event.listen(this.fileElement, Mojo.Event.propertyChange, this.textChanged.bindAsEventListener(this))
	Mojo.Event.listen(this.urlElement, Mojo.Event.tap, this.linkClicked.bind(this))
	
}

UploadAssistant.prototype.getRandomSubTitle = function() {
	
	// loop to get total weight value
	var weight = 0;
	for (var r = 0; r < this.randomSub.length; r++) {
		weight += this.randomSub[r].weight
	}
	
	// random weighted value
	var rand = Math.floor(Math.random() * weight)
	
	// loop through to find the random title
	for (var r = 0; r < this.randomSub.length; r++) {
		if (rand <= this.randomSub[r].weight) {
			if (this.randomSub[r].title) this.appTitleElement.innerHTML = this.randomSub[r].title
			return this.randomSub[r].text
		} else {
			rand -= this.randomSub[r].weight
		}
	}
	
	// if no random title was found (for whatever reason, wtf?) return first and best subtitle
	return this.randomSub[0].text
}

UploadAssistant.prototype.linkClickChoice = function(command) {
	
	switch (command) {
		
		case 'view-cmd':
			this.controller.serviceRequest('palm://com.palm.applicationManager', {
		    	method: 'open',
		    	parameters: {
		     		id: 'com.palm.app.browser',
		      		params: {
			        	target: this.urlElement.innerHTML
			      	}
		    	}
		  	})
			break;
		
		case 'copy-cmd':
			this.controller.stageController.setClipboard(this.urlElement.innerHTML)
			break;
	}
	
}

UploadAssistant.prototype.linkClicked = function(event) {

	this.controller.popupSubmenu(
		{
			onChoose: this.linkClickChoice.bind(this),
  			placeNear: event.target,
  			items: [{label: $L('View'), command: 'view-cmd'},
      				{label: $L('Copy'), command: 'copy-cmd'}]
		}
	)
	
}

UploadAssistant.prototype.textChanged = function(event) {

	if (event.value == '')
		this.fileUploadModel.disabled = true
	else
		this.fileUploadModel.disabled = false
    this.controller.modelChanged(this.fileUploadModel)
	
}

UploadAssistant.prototype.pickFile = function(event) {
	
	Mojo.FilePicker.pickFile({onSelect: this.filePicked.bind(this)}, Mojo.Controller.stageController)
	
}

UploadAssistant.prototype.filePicked = function(file) {
	
    this.fileElement.mojo.setValue(file.fullPath)
    this.fileUploadModel.disabled = false
    this.controller.modelChanged(this.fileUploadModel)
    this.urlElement.innerHTML  = ''
    
}

UploadAssistant.prototype.uploadFile = function(event) {
	
	if (!this.processing) {
		this.processing = true
		this.controller.serviceRequest('palm://com.palm.downloadmanager/', {
			method: 'upload',
		  	parameters: {
		  		'fileLabel': 'file1',
		    	'fileName': this.fileElement.mojo.getValue(),
		  		'url': 'http://ompldr.org/upload',
				subscribe: true
		  	},
			onSuccess: function (resp) {
			    if (resp.completed) {
			    	var r = this.idRegExp.exec(resp.responseString)
			    	if (r && r.length>1) { 
				    	this.urlElement.innerHTML = 'http://ompldr.org/v'+r[1]
				    	this.fileElement.mojo.setValue('')
				    	this.controller.get('buttonUpload').mojo.deactivate()
			    	} else {
			    		Mojo.Log.error(Object.toJSON(resp))
			    	}
		    	}
		    	this.processing = false
			}.bind(this),
			onFailure: function (e) {
			    Mojo.Log.error('Failure : ' + Object.toJSON(resp));
			    this.controller.get('buttonUpload').mojo.deactivate()
			}.bind(this)
		});
	}

}

UploadAssistant.prototype.activate = function(event) {
}

UploadAssistant.prototype.deactivate = function(event) {
}

UploadAssistant.prototype.cleanup = function(event) {
}
