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
	
	override func viewDidLoad() {
		let user = GIDSignIn.sharedInstance().currentUser
		signOutCell.textLabel?.text = user == nil ? "Sign In" : "Sign out"
	}
	
	override func numberOfSections(in tableView: UITableView) -> Int {
		let user = GIDSignIn.sharedInstance().currentUser
		if let user = user {
			return userIsAdmin(user: user) ? 3 : 2
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
