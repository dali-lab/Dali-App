//
//  MainViewController.swift
//  
//
//  Created by John Kotz on 6/25/17.
//
//

import Foundation
import UIKit
import SCLAlertView
import UserNotifications
import daliAPI

class MainViewController: UIViewController, UITableViewDelegate, UITableViewDataSource, AlertShower {
	@IBOutlet weak var daliImage: UIImageView!
	@IBOutlet weak var internalView: UIView!
	@IBOutlet weak var locationLabel: UILabel!
	@IBOutlet weak var tableView: UITableView!
	
	var viewShown = false
	var loginTransformAnimationDone: Bool!
	var animationDone: (() -> Void)?
	
	var events = [[Event]]()
	var sections = [String]()
	
	override func viewDidLoad() {
		UIApplication.shared.statusBarStyle = .lightContent
		self.setNeedsStatusBarAppearanceUpdate()
		self.setUpListeners()
		self.locationUpdated()
		self.updateData()
		(UIApplication.shared.delegate as! AppDelegate).mainViewController = self
		
		CalendarController()
		daliAPI.hello()
		
		tableView.estimatedRowHeight = 140
	}
	
	
	func updateData() {
		ServerCommunicator.current?.getEvents(thisWeek: true, callback: { eventsArr in
			print("Got events: \(eventsArr.count)");
			
			var events = eventsArr.sorted(by: { (event1, event2) -> Bool in
				return event1.startTime < event2.startTime
			})
			
			self.events = []
			
			var today = [Event]();
			var week = [Event]();
			var next = [Event]();
			let calendar = NSCalendar.current
			
			func getWeekEnd() -> Date {
				let cal = Calendar.current
				var comps = cal.dateComponents([.weekOfYear, .yearForWeekOfYear], from: Date())
				comps.weekday = 7 // Saturday
				comps.hour = 23
				comps.minute = 59
				comps.second = 59
				let endWeek = cal.date(from: comps)!
				return endWeek
			}
			
			print(getWeekEnd())
			
			for event in events {
				print(event)
				if calendar.isDateInToday(event.startTime) {
					today.append(event)
				}else if event.startTime < getWeekEnd() {
					week.append(event)
				}else{
					next.append(event)
				}
			}
			if today.count > 0 {
				self.events.append(today)
				self.sections.append("Today")
			}
			self.events.append(week)
			self.sections.append("This Week")
			if next.count > 0 {
				self.events.append(next)
				self.sections.append("Next Week")
			}
			
			DispatchQueue.main.async {
				self.tableView.reloadData()
			}
		})
	}
	
	func setUpListeners() {
		NotificationCenter.default.addObserver(self, selector: #selector(MainViewController.locationUpdated), name: NSNotification.Name.Custom.LocationUpdated, object: nil)
	}
	
	deinit {
		NotificationCenter.default.removeObserver(self)
	}
	
	func locationUpdated() {
		if let controller = (UIApplication.shared.delegate as! AppDelegate).beaconController, let location = controller.currentLocation {
			self.locationLabel.text = "In \(location)"
		}else{
			self.locationLabel.text = "Not in DALI Lab"
		}
	}
	
	override func viewWillAppear(_ animated: Bool) {
		if !viewShown {
			startAnimation()
		}
	}
	
	func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "eventCell", for: indexPath) as! EventCell
		let event = events[indexPath.section][indexPath.row]
		
		cell.event = event
		return cell
	}
	
	func numberOfSections(in tableView: UITableView) -> Int {
		return events.count
	}
	
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return events[section].count
	}
	
	func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
		let view = UIView()
		let backgroundView = UIVisualEffectView(effect: UIBlurEffect(style: UIBlurEffectStyle.regular))
		backgroundView.backgroundColor = #colorLiteral(red: 0.1450980392, green: 0.5843137255, blue: 0.6588235294, alpha: 0.6546819982)
		backgroundView.layer.cornerRadius = 4
		backgroundView.clipsToBounds = true
		
		let active = events[section].count > 0
		
		let label = UILabel()
		label.font = UIFont(name: "AvenirNext-Italic", size: 15)!
		label.text = sections[section]
		label.textColor = active ? UIColor.white : UIColor(red: 1, green: 1, blue: 1, alpha: 0.5)
		label.sizeToFit()
		
		view.addSubview(backgroundView)
		view.addSubview(label)
		
		NSLayoutConstraint.activate([
			label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
			label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
			
			backgroundView.leftAnchor.constraint(equalTo: view.leftAnchor),
			backgroundView.rightAnchor.constraint(equalTo: view.rightAnchor),
			backgroundView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
			backgroundView.topAnchor.constraint(equalTo: view.topAnchor)
			])
		label.translatesAutoresizingMaskIntoConstraints = false
		backgroundView.translatesAutoresizingMaskIntoConstraints = false
		
		return view
	}
	
	func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
		return UITableViewAutomaticDimension
	}
	
	func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
		return 30
	}
	
	func showAlert(alert: SCLAlertView, title: String, subTitle: String, color: UIColor, image: UIImage) {
		animationDone = { () in
			UIApplication.shared.statusBarStyle = .default
			let _ = alert.showCustom(title, subTitle: subTitle, color: color, icon: image)
		}
	}
	
	func startAnimation() {
		let mid = self.view.frame.size.height / 2.0
		let top = mid - self.daliImage.frame.height / 2.0
		var transformedTop = top
		if self.loginTransformAnimationDone {
			transformedTop = top - 90
		}
		
		let startingCenter = daliImage.center
		daliImage.center =
			CGPoint(x: daliImage.center.x, y: daliImage.center.y + (transformedTop - self.daliImage.frame.origin.x / 2 + 18))
		
		daliImage.transform = CGAffineTransform(scaleX: 3.0/2.0, y: 3.0/2.0)
		internalView.alpha = 0.0
		
		UIView.animate(withDuration: 1.3, delay: 0.5, options: [.curveEaseInOut], animations: {
			self.daliImage.center = startingCenter
			self.daliImage.transform = CGAffineTransform(scaleX: 1.0, y: 1.0)
		}) { (success) in
			UIView.animate(withDuration: 0.5, delay: 0.0, options: [], animations: {
				self.internalView.alpha = 1.0
			}) { (success) in
				if let animationDone = self.animationDone {
					animationDone()
				}
			}
			self.viewShown = true
		}
	}
	
	func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		let event = events[indexPath.section][indexPath.row]
		
		let appearance = SCLAlertView.SCLAppearance(
			showCloseButton: false
		)
		
		let alert = SCLAlertView(appearance: appearance)
		alert.addButton("Add to your calendar") {
			tableView.deselectRow(at: indexPath, animated: true)
			
			CalendarController.current.showCalendarChooser(on: self)
		}
		alert.addButton("Set up checkin") {
			tableView.deselectRow(at: indexPath, animated: true)
			
		}
		alert.addButton("Cancel") {
			tableView.deselectRow(at: indexPath, animated: true)
			
		}
		
		alert.showInfo("Whats up?", subTitle: "What do you want to do with \(event.name)?")
	}
}

class EventCell: UITableViewCell {
	@IBOutlet weak var titleLabel: UILabel!
	@IBOutlet weak var timeLabel: UILabel!
	@IBOutlet weak var locationLabel: UILabel!
	
	
	private var eventVal: Event?
	var event: Event? {
		get {
			return self.eventVal
		}
		set {
			self.eventVal = newValue
			if let newValue = newValue {
				self.titleLabel.text = newValue.name
//				self.timeLabel.text = newValue.name
				self.locationLabel.text = newValue.location
				
				let startComponents = Calendar.current.dateComponents([.weekday, .hour, .minute], from: newValue.startTime)
				let endComponents = Calendar.current.dateComponents([.weekday, .hour, .minute], from: newValue.endTime)
				
				let weekdayStart = abvWeekDays[startComponents.weekday! - 1]
				let weekdayEnd = startComponents.weekday! != endComponents.weekday! ? abvWeekDays[endComponents.weekday! - 1] : nil
				
				let startHour = startComponents.hour! > 12 ? startComponents.hour! - 12 : startComponents.hour!
				let endHour = endComponents.hour! > 12 ? endComponents.hour! - 12 : endComponents.hour!
				
				let startMinute = startComponents.minute!
				let endMinute = endComponents.minute!
				
				let startDaytime = startHour >= 12
				let endDaytime = endHour >= 12
				
				let daytimeDifferent = startDaytime != endDaytime
				
				let startString = "\(startHour):\(startMinute  < 10 ? "0" : "")\(startMinute)\(daytimeDifferent ? " \(startDaytime ? "AM" : "PM")" : "")"
				let endString = "\(endHour):\(endMinute < 10 ? "0" : "")\(endMinute) \(endDaytime ? "AM" : "PM")"
				
				self.timeLabel.text = "\(weekdayStart) \(startString) - \(weekdayEnd == nil ? "" : weekdayEnd! + " ")\(endString)"
			}else{
				self.titleLabel.text = ""
			}
		}
	}
}
