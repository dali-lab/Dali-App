//
//  PeopleInLabViewController.swift
//  dali
//
//  Created by John Kotz on 6/25/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import Foundation
import UIKit

class PeopleInLabViewController : UITableViewController {
	
	var timLocation = "Loading..."
	var timLocationLabel: UILabel?
	var users: [SharedUser]?
	var refreshTimer: Timer!
	
	override func viewDidLoad() {
		
	}
	
	override func viewWillAppear(_ animated: Bool) {
		self.refreshTimer = Timer(timeInterval: 5, repeats: true, block: { (timer) in
			self.reloadData()
		})
		self.refreshTimer.fire()
		RunLoop.current.add(self.refreshTimer, forMode: .commonModes)
	}
	
	override func viewWillDisappear(_ animated: Bool) {
		self.refreshTimer.invalidate()
	}
	
	func reloadData() {
		ServerCommunicator.current?.getTimLocation(callback: { (inDALI, inOffice) in
			if inOffice {
				self.timLocation = "In his office"
			}else if inDALI {
				self.timLocation = "In DALI"
			}else{
				self.timLocation = "Location unknown"
			}
			self.timLocationLabel?.text = self.timLocation
			self.tableView.reloadData()
		})
		
		ServerCommunicator.current?.getPeopleInLab(callback: { (users) in
			self.users = users
			self.tableView.reloadData()
		})
		
	}
	
	override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		if section === 0 {
			return 1
		}else{
			return users?.count ?? 0
		}
	}
	
	override func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
		return 50
	}
	
	override func numberOfSections(in tableView: UITableView) -> Int {
		return 2
	}
	
	override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
		switch section {
		case 0:
			return "TIM LOCATION"
		case 1:
			return "DALI MEMBERS"
		default:
			print("Unknown section number")
			return nil
		}
	}
	
	override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		var cell: UITableViewCell?
		switch indexPath.section {
		case 0:
			cell = tableView.dequeueReusableCell(withIdentifier: "timCell", for: indexPath)
			
			cell?.textLabel?.text = "Tim Tregubov"
			cell?.detailTextLabel?.text = self.timLocation
			self.timLocationLabel = cell?.detailTextLabel
			break
		case 1:
			cell = tableView.dequeueReusableCell(withIdentifier: "memberCell", for: indexPath)
			let user = users![indexPath.row]
			cell?.textLabel?.text = user.name
			break
		default:
			return UITableViewCell()
		}
		
		return cell!
	}
	
	@IBAction func donePressed(_ sender: Any) {
		self.navigationController?.dismiss(animated: true) {
			
		}
	}
}
