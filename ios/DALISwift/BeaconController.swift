//
//  BeaconController.swift
//  dali
//
//  Created by John Kotz on 7/1/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import Foundation
import ProximityKit
import GoogleSignIn

class BeaconController: NSObject, RPKManagerDelegate {
	
	static var current: BeaconController?
	var user: GIDGoogleUser?
	var beaconManager: RPKManager = RPKManager()
	
	override init() {
		let user = GIDSignIn.sharedInstance().currentUser
		
		super.init()
		
		self.beaconManager = RPKManager(delegate: self, andConfig: [
			"kit_url": "https://proximitykit.radiusnetworks.com/api/kits/9339",
			"api_token": "753b54a6bf172823b68c10c9966c4d6da40ff85f57ef65ad0e155fcb40d0ccb2",
			])
		self.beaconManager.start()
		
		do {
			try self.staticSetup()
		}catch {
			fatalError()
		}
	}
	
	private func staticSetup() throws {
		if BeaconController.current != nil {
			throw BeaconError.DuplicateController
		}
		BeaconController.current = self
	}
	
	func proximityKit(_ manager: RPKManager!, didEnter region: RPKRegion!) {
		
	}
	
	func proximityKit(_ manager: RPKManager!, didExit region: RPKRegion!) {
		
	}
	
	enum BeaconError: Error {
		case DuplicateController
	}
}
