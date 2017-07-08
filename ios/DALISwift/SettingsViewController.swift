//
//  SettingsViewController.swift
//  DALISwift
//
//  Created by John Kotz on 7/6/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import Foundation
import UIKit

class SettingsViewController: UITableViewController {
	@IBOutlet weak var signOutCell: UITableViewCell!
	@IBOutlet weak var enterSwitch: UISwitch!
	@IBOutlet weak var checkInSwitch: UISwitch!
	@IBOutlet weak var votingSwitch: UISwitch!
	@IBOutlet weak var shareSwitch: UISwitch!
	
	let defaults: UserDefaults = UserDefaults(suiteName: "Settings")!
	
	override func viewDidLoad() {
		let user = GIDSignIn.sharedInstance().currentUser
		signOutCell.textLabel?.text = user == nil ? "Sign In" : "Sign out"
		
		enterSwitch.isOn = defaults.value(forKey: "enterExitNotification") != nil ? defaults.bool(forKey: "enterExitNotification") : false
		checkInSwitch.isOn = defaults.value(forKey: "checkInNotification") != nil ? defaults.bool(forKey: "checkInNotification") : true
		votingSwitch.isOn = defaults.value(forKey: "votingNotification") != nil ? defaults.bool(forKey: "votingNotification") : true
		shareSwitch.isOn = defaults.value(forKey: "sharePreference") != nil ? defaults.bool(forKey: "sharePreference") : true
	}
	
	@IBAction func switchChanged(_ sender: UISwitch) {
		defaults.set(sender.isOn, forKey: sender.accessibilityLabel!)
	}
	
	override func numberOfSections(in tableView: UITableView) -> Int {
		let user = GIDSignIn.sharedInstance().currentUser
		if let user = user {
			return userIsAdmin(user: user) ? 4 : 3
		}else{
			return 1
		}
	}
	
	@IBAction func done(_ sender: Any) {
		self.navigationController?.dismiss(animated: true, completion: {
			
		})
	}
	
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		if indexPath.section == 0 {
			// Sign out
			AppDelegate.shared?.signOut()
		}
	}
}
