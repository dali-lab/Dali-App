//
//  ServerCommunicator.swift
//  DALISwift
//
//  Created by John Kotz on 7/5/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import Foundation

class ServerCommunicator {
	static var current: ServerCommunicator?
	var backgroundTask: UIBackgroundTaskIdentifier = UIBackgroundTaskInvalid
	var refreshTimer: Timer?
	var backgroundTaskNumFires = 0
	
	func registerBackgroundTask() {
		backgroundTaskNumFires = 0
		backgroundTask = UIApplication.shared.beginBackgroundTask { [weak self] in
			self?.endBackgroundTask()
		}
		assert(backgroundTask != UIBackgroundTaskInvalid)
	}
	
	func endBackgroundTask() {
		print("Background task ended.")
		UIApplication.shared.endBackgroundTask(backgroundTask)
		backgroundTask = UIBackgroundTaskInvalid
	}
	
	/**
		Initializes the communicator
	*/
	init() {
		if ServerCommunicator.current != nil {
			fatalError("Tried to make more than one server communicator!")
		}
		ServerCommunicator.current = self
		
		NotificationCenter.default.addObserver(self, selector: #selector(ServerCommunicator.enterExitDALI(notification:)), name: Notification.Name.Custom.EnteredOrExitedDALI, object: nil)
		NotificationCenter.default.addObserver(self, selector: #selector(ServerCommunicator.enterExitCheckIn(notification:)), name: Notification.Name.Custom.CheckInEnteredOrExited, object: nil)
		NotificationCenter.default.addObserver(self, selector: #selector(ServerCommunicator.timsOfficeEnterExit(notification:)), name: Notification.Name.Custom.TimsOfficeEnteredOrExited, object: nil)
	}
	
	/**
	Responds to the given notification about entering or exiting Tim's office. Posts to the server to let it know
	
	- Parameters:
		- notification: Notification - The notification that triggered the call
	*/
	@objc func timsOfficeEnterExit(notification: Notification) {
		let entered = (notification.userInfo?["entered"] as? Bool) ?? false
		guard let user = GIDSignIn.sharedInstance().currentUser else {
			return
		}
		if !userIsTim(user: user) {
			return
		}
		
		let json: [String: Any] = [
			"location": "OFFICE",
			"enter": entered
		]
		
		if let jsonData = try? JSONSerialization.data(withJSONObject: json) {
			ServerCommunicator.post(url: "https://dalilab.herokuapp.com/location/tim", data: jsonData, callback: {})
		}
	}
	
	/**
	Responds to the given notification about entering or exiting the check-in range. Posts to the server to let it know
	
	- Parameters:
		- notification: Notification - The notification that triggered the call
	*/
	@objc func enterExitCheckIn(notification: Notification) {
		let entered = (notification.userInfo?["entered"] as? Bool) ?? false
		guard let user = GIDSignIn.sharedInstance().currentUser else {
			return
		}
		
		let json: [String: Any] = [
			"userID": user.userID,
			"entering": entered
		]
		
		if let jsonData = try? JSONSerialization.data(withJSONObject: json) {
			ServerCommunicator.post(url: "https://dalilab.herokuapp.com/checkIn", data: jsonData, callback: {
				if entered {
					NotificationCenter.default.post(name: Notification.Name.Custom.CheckInComeplte, object: nil)
				}
			})
		}
	}
	
	/**
		Responds to the given notification about entering or exiting the lab. Posts to the server to let it know
	
	- Parameters:
		- notification: Notification - The notification that triggered the call
	*/
	@objc func enterExitDALI(notification: Notification) {
		let entered = (notification.userInfo?["entered"] as? Bool) ?? false
		guard let user = GIDSignIn.sharedInstance().currentUser else {
			return
		}
		
		let json: [String: Any] = [
			"user": [
				"email": user.profile.email,
				"id": user.userID,
				"familyName": user.profile.familyName,
				"givenName": user.profile.givenName,
				"name": user.profile.name
			],
			"inDALI": entered,
			"share": SettingsController.getSharePref()
		]
		
		if let jsonData = try? JSONSerialization.data(withJSONObject: json) {
			ServerCommunicator.post(url: "https://dalilab.herokuapp.com/location/enterExit", data: jsonData, callback: {})
		}
		
		if userIsTim(user: user) {
			let json: [String: Any] = [
				"location": "DALI",
				"enter": entered
			]
			
			if let jsonData = try? JSONSerialization.data(withJSONObject: json) {
				ServerCommunicator.post(url: "https://dalilab.herokuapp.com/location/tim", data: jsonData, callback: {})
			}
		}
		
		
		if self.refreshTimer == nil {
			registerBackgroundTask()
			self.refreshTimer = Timer.scheduledTimer(timeInterval: 60, target: self, selector: #selector(ServerCommunicator.updateDALI), userInfo: nil, repeats: true)
			RunLoop.main.add(self.refreshTimer!, forMode: .commonModes)
		}
	}
	
	@objc func updateDALI() {
		guard let user = GIDSignIn.sharedInstance().currentUser else {
			self.refreshTimer?.invalidate()
			endBackgroundTask()
			return
		}
		
		backgroundTaskNumFires += 1
		
		self.getPeopleInLab(callback: { (users) in
			if BeaconController.current?.inDALI ?? BeaconController().inDALI {
				// I am in DALI
				// So if the server says I'm there
				if users.contains(where: { (userObj) -> Bool in return userObj.email == user.profile.email }) {
					// Then the server is correct
					self.endBackgroundTask()
					self.refreshTimer?.invalidate()
				}else{
					// The server is wrong
					self.enterExitDALI(notification: Notification(name: Notification.Name.Custom.EnteredOrExitedDALI, object: nil, userInfo: ["entered": true]))
				}
			}else{
				// I am not in DALI
				// So if the server says I'm not there
				if !users.contains(where: { (userObj) -> Bool in return userObj.email == user.profile.email }) {
					// Then the server is correct
					self.endBackgroundTask()
					self.refreshTimer?.invalidate()
				}else{
					// The server is wrong
					self.enterExitDALI(notification: Notification(name: Notification.Name.Custom.EnteredOrExitedDALI, object: nil, userInfo: ["entered": false]))
				}
			}
			
			if self.backgroundTaskNumFires >= 4 {
				self.refreshTimer?.invalidate()
				self.endBackgroundTask()
			}
		})
	}
	
	/**
		Pulls the list of people in the lab from the server
	
	Parameters:
	- callback: ([SharedUser])->Void - The callback that will be called when the data has arrived, including a list of the SharedUsers
	*/
	func getPeopleInLab(callback: @escaping (_ people: [SharedUser]) -> Void) {
		ServerCommunicator.get(url: "https://dalilab.herokuapp.com/location/shared") { (data) in
			guard let people = data as? [[String: Any]] else {
				print("Data for url https://dalilab.herokuapp.com/location/shared not expected: \(data)")
				return
			}
			
			var outputPeople = [SharedUser]()
			
			for person in people {
				guard let email = person["email"] as? String else {
					print("Email missing!")
					print("Data for url https://dalilab.herokuapp.com/location/shared not expected: \(data)")
					return
				}
				
				guard let name = person["name"] as? String else {
					print("Name missing!")
					print("Data for url https://dalilab.herokuapp.com/location/shared not expected: \(data)")
					return
				}
				
				let person = SharedUser(email: email, name: name)
				outputPeople.append(person)
			}
			
			callback(outputPeople)
		}
	}
	
	func getEventNow(_ callback: @escaping (_ event: Event?) -> Void) {
		ServerCommunicator.get(url: "https://dalilab.herokuapp.com/voting/current" + ServerCommunicator.getAPIKey()) { (data) in
			guard data is [String: Any] else {
				return
			}
			
/*{
"name": "Computer Science Unleashed",
"image": "https://github.com/dali-lab/Dali-App/raw/vote-order/components/Assets/pitchLightBulb.png",
"description": "Best Presentation Prize",
"resultsReleased": false,
"options": [
{
"name": "In Relationship",
"awards": null,
"id": "5961475ffba9a30011b7dbd9"
},
{
"name": "BorrowIt",
"awards": null,
"id": "5961475ffba9a30011b7dbe0"
}
],
"id": "5961475ffba9a30011b7dbd6"
}*/
			
//			guard let 
		}
	}
	
	/**
		Pulls the location of Tim from the server
	
	Parameters:
		- callback: (Bool, Bool)->Void - The callback that will be called when the data has arrived, data arranged as: (inDALI, inOffice)
	*/
	func getTimLocation(callback: @escaping (_ inDALI: Bool, _ inOffice: Bool) -> Void) {
		ServerCommunicator.get(url: "https://dalilab.herokuapp.com/location/tim") { (data) in
			guard let info = data as? [String: Bool] else {
				print("Data for url https://dalilab.herokuapp.com/location/tim not expected: \(data)")
				return
			}
			
			guard let inDALI = info["inDALI"] else {
				print("No inDALI!")
				return
			}
			
			guard let inOffice = info["inOffice"] else {
				print("No inOffice!")
				return
			}
			
			callback(inDALI, inOffice)
		}
	}
	
	
	func getEvents(thisWeek: Bool , callback: @escaping (_ events: [Event]) -> Void) {
		ServerCommunicator.get(url: "http://dalilab-api.herokuapp.com/api/events\(thisWeek ? "/week" : "")" + ServerCommunicator.getAPIKey()) { (data) in
			guard let events = data as? [[String: Any]] else {
				print("Data for url https://dalilab.herokuapp.com/location/tim not expected: \(data)")
				return;
			}
			
			/*
			[
				"membersInAttendance": <__NSArray0 0x602000007e10>(),
				"location": Reviewer: Adam,
				"name": DALI Internal Code/Design Review,
				"googleID": 0n083tksmlerp58s8d3vo29gcf,
				"recurrence": <null>,
				"id": 595fed10245fd40022ba36e7,
				"__v": 0,
				"description": DALI Internal Code/Design Review,
				"endTime": 2017-08-03T00:00:00.000Z,
				"votingEnabled": 0,
				"startTime": 2017-08-02T23:00:00.000Z
			]
			*/
			
			var eventOutput = [Event]();
			
			let dateFormatter = DateFormatter()
			dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
			
			for event in events {
				let startTime: Date = dateFormatter.date(from: event["startTime"] as! String)!
				let endTime: Date = dateFormatter.date(from: event["endTime"] as! String)!
				
				var recurrence: Recurrence?
				if let rec = event["recurrence"] as? [String:Any] {
					let until: Date? = rec["until"] as? String == nil ? nil : dateFormatter.date(from: rec["until"] as! String)
					
					recurrence = Recurrence(frequency: Recurrence.Frequency(rawValue: rec["frequency"] as! String)!, interval: rec["interval"] as? String == nil ? nil : Int(rec["interval"] as! String), periodData: rec["periodData"] as? [Int], rrule: rec["rrule"] as! String, until: until)
				}
			
				let eventObj = Event(
					name: event["name"] as! String,
					location: event["location"] as? String ?? "",
					description: event["description"] as! String,
					googleID: event["googleID"] as! String,
					recurrence: recurrence,
					id: event["id"] as! String,
					startTime: startTime,
					endTime: endTime,
					voting: event["eventObj"] as? Bool ?? false,
					options: nil)
				
				eventOutput.append(eventObj)
			}
			
			callback(eventOutput)
		}
	}
	
	
	// MARK : POST and GET methods
	// ===========================
	
	/**
		Makes a GET request on a given url, calling the callback with the response JSON object when its done
	
- Paramters:
	- url: String - The URL you wan to GET from
	- callback: (response: Any)->Void - The callback that will be invoked when the task is done
	*/
	static func get(url: String, callback: @escaping (_ response: Any) -> Void) {
		let url = URL(string: url)!
		
		let task = URLSession.shared.dataTask(with: url) { data, response, error in
			if let error = error {
				print(error)
				return
			}
			guard let data = data else {
				print("Data is empty")
				return
			}
			
			let json = try! JSONSerialization.jsonObject(with: data, options: [])
			callback(json)
		}
		
		task.resume()
	}
	
	static func getAPIKey() -> String {
		return "?key=\(apiPrivateKey)"
	}
	
	static func getServerKey() -> String {
		return "?key=\(serverPrivateKey)"
	}
	
	/**
		Makes a POST request to the given url using the given data, using the callback when it is done
	
- Parameters:
	- url: String - The URL you want to post to
	- data: Data - A JSON encoded data string to be sent to the server
	- callback: ()->Void - A callback that will be invoked when the process is complete
	*/
	static func post(url: String, data: Data, callback: @escaping () -> Void) {
		var request = URLRequest(url: URL(string: url)!)
		request.httpMethod = "POST"
		request.httpBody = data
		request.addValue("application/json", forHTTPHeaderField: "Content-Type")
		request.addValue("application/json", forHTTPHeaderField: "Accept")
		
		// Set up the task
		let task = URLSession.shared.dataTask(with: request) { data, response, error in
			guard let _ = data, error == nil else {                                                 // check for fundamental networking error
				print("error=\(String(describing: error))")
				return
			}
			
			if let httpStatus = response as? HTTPURLResponse, httpStatus.statusCode != 200 {           // check for http errors
				print("statusCode should be 200, but is \(httpStatus.statusCode)")
			}
			callback()
		}
		
		// And complete it
		task.resume()
	}
}
