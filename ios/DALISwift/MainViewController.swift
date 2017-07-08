//
//  MainViewController.swift
//  
//
//  Created by John Kotz on 6/25/17.
//
//

import Foundation
import UIKit

class MainViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
	@IBOutlet weak var daliImage: UIImageView!
	@IBOutlet weak var internalView: UIView!
	@IBOutlet weak var locationLabel: UILabel!
	@IBOutlet weak var tableView: UITableView!
	
	var viewShown = false
	var loginTransformAnimationDone: Bool!
	
	var events = [[Event]]()
	var sections = [String]()
	
	override func viewDidLoad() {
		UIApplication.shared.statusBarStyle = .lightContent
		self.setNeedsStatusBarAppearanceUpdate()
		self.setUpListeners()
		self.locationUpdated()
		self.updateData()
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
				let endWeek = cal.date(from: comps)!
				return endWeek
			}
			
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
			if week.count > 0 {
				self.events.append(week)
				self.sections.append("This Week")
			}
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
		
		let label = UILabel()
		label.text = sections[section]
		label.textColor = UIColor.white
		label.sizeToFit()
		view.addSubview(label)
		
		NSLayoutConstraint.activate([
			label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
			label.centerXAnchor.constraint(equalTo: view.centerXAnchor)
			])
		label.translatesAutoresizingMaskIntoConstraints = false
		
		return view
	}
	
	func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
		return 30
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
			UIView.animate(withDuration: 0.5, animations: {
				self.internalView.alpha = 1.0
			})
			self.viewShown = true
		}
	}
}

class EventCell: UITableViewCell {
	private var eventVal: Event?
	var event: Event? {
		get {
			return self.eventVal
		}
		set {
			self.eventVal = newValue
			self.textLabel?.text = newValue?.name
		}
	}
}
