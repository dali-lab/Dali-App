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
	var numRanged = 0
	
	var currentLocation: String? {
		return regions.filter({ (region) -> Bool in
			return (Int(region.attributes["locationPriority"] as! String))! > 0
		}).sorted(by: { (region1, region2) -> Bool in
			return (Int(region1.attributes["locationPriority"] as! String))! > (Int(region2.attributes["locationPriority"] as! String))!
		}).first?.name.replacingOccurrences(of: " Region", with: "").replacingOccurrences(of: "\\", with: "")
	}
	
	private var regions = Set<RPKRegion>()
	
	override init() {
		user = GIDSignIn.sharedInstance().currentUser
		
		super.init()
		
		do {
			try self.staticSetup()
		}catch {
			fatalError()
		}
		
		self.beaconManager = RPKManager(delegate: self, andConfig: [
			"kit_url": "https://proximitykit.radiusnetworks.com/api/kits/9339",
			"api_token": "753b54a6bf172823b68c10c9966c4d6da40ff85f57ef65ad0e155fcb40d0ccb2",
			"allow_cellular_data": true
			])
		self.beaconManager.start()
	}
	
	func proximityKitDidSync(_ manager : RPKManager) {
		print("Proximity Kit did sync")
	}
	
	func proximityKit(_ manager: RPKManager!, didDetermineState state: RPKRegionState, for region: RPKRegion!) {
		var stateDescription: String
		
		switch (state) {
		case .inside:
			regions.insert(region!)
			stateDescription = "Inside"
		case .outside:
			regions.remove(region!)
			stateDescription = "Outside"
		case .unknown:
			stateDescription = "Unknown"
		}
		
		print("State Changed: \(stateDescription) Region \(region.name ?? "untitled") (\(region.identifier ?? ""))")
		print("Now in: \(self.currentLocation ?? "unknown")")
		NotificationCenter.default.post(name: NSNotification.Name.Custom.LocationUpdated, object: nil)
	}
	
	deinit {
		self.beaconManager.stopRangingIBeacons()
		self.beaconManager.stopAdvertising()
		self.beaconManager.stop()
	}
	
	private func staticSetup() throws {
		if BeaconController.current != nil {
			throw BeaconError.DuplicateController
		}
		BeaconController.current = self
	}
	
	func proximityKit(_ manager : RPKManager, didEnter region:RPKRegion) {
		print("Entered Region \(region.name), \(region.identifier)");
	}
	
	func proximityKit(_ manager : RPKManager, didExit region:RPKRegion) {
		print("Exited Region \(region.name), \(region.identifier)");
		region.attributes
	}
	
	enum BeaconError: Error {
		case DuplicateController
	}
}
