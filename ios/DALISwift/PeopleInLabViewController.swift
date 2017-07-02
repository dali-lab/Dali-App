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
	
	@IBAction func donePressed(_ sender: Any) {
		print("Done Pressed")
		self.navigationController?.dismiss(animated: true) {
			
		}
	}
}
