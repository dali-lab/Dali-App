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

/**
 Handles all beacon activity for the application. It tracks at all times, even in the background, the beacon's nearby to get an accurate understanding of position

Functions:
 -

Properties:
- currentLocation: String?
	Generated property
 */
class BeaconController: NSObject, RPKManagerDelegate {
	
	static let notificationNames: [String: Notification.Name] = [
		"DALI Lab Region": Notification.Name.Custom.EnteredOrExitedDALI,
		"Check In Region": Notification.Name.Custom.CheckInEnteredOrExited,
		"Tims Office Region": Notification.Name.Custom.TimsOfficeEnteredOrExited,
		"Event Vote Region": Notification.Name.Custom.EventVoteEnteredOrExited
	]
	
	static var current: BeaconController?
	var user: GIDGoogleUser?
	var beaconManager: RPKManager = RPKManager()
	var numToRange = 0
	
	var refreshTimers = [RPKRegion:Timer]()
	
	var currentLocation: String? {
		return regions.filter({ (region) -> Bool in
			return (Int(region.attributes["locationPriority"] as! String))! > 0
		}).sorted(by: { (region1, region2) -> Bool in
			return (Int(region1.attributes["locationPriority"] as! String))! > (Int(region2.attributes["locationPriority"] as! String))!
		}).first?.name.replacingOccurrences(of: " Region", with: "").replacingOccurrences(of: "\\", with: "")
	}
	
	var inDALI: Bool {
		return regions.filter({ (region) -> Bool in
			return region.name == "DALI Lab Region"
		}).count >= 1
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
		// A good buffer to find all the beacons possible
		numToRange = 50
		self.beaconManager.startRangingBeacons()
	}
	
	func proximityKit(_ manager: RPKManager!, didDetermineState state: RPKRegionState, for region: RPKRegion!) {
		
		switch (state) {
		case .inside:
			regions.insert(region!)
			
			let regionName = region.name.replacingOccurrences(of: "'", with: "")
			if let name = BeaconController.notificationNames[regionName] {
				NotificationCenter.default.post(name: name, object: nil, userInfo: ["entered" : true])
			}
			
		case .outside:
			regions.remove(region!)
			
			let regionName = region.name.replacingOccurrences(of: "'", with: "")
			if let name = BeaconController.notificationNames[regionName] {
				NotificationCenter.default.post(name: name, object: nil, userInfo: ["entered" : false])
			}
		case .unknown:
			
			let regionName = region.name.replacingOccurrences(of: "'", with: "")
			if let name = BeaconController.notificationNames[regionName] {
				NotificationCenter.default.post(name: name, object: nil, userInfo: ["entered" : false])
			}
		}
		
//		print("State Changed: \(stateDescription) Region \(region.name ?? "untitled") (\(region.identifier ?? ""))")
//		print("Now in: \(self.currentLocation ?? "unknown")")
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
		print("Entered Region \(region.name ?? "unknown name"), \(region.identifier ?? "unknown id")");
	}
	
	func proximityKit(_ manager : RPKManager, didExit region:RPKRegion) {
		print("Exited Region \(region.name ?? "unknown name"), \(region.identifier ?? "unknown id")");
	}
	
	func proximityKit(_ manager: RPKManager!, didRangeBeacons beacons: [Any]!, in region: RPKBeaconRegion!) {
		if numToRange <= 0 {
			self.beaconManager.stopRangingIBeacons()
			return
		}
		
		numToRange -= 1
		if beacons.count == 0 && regions.contains(region) {
			// I am not going to deal with exits here. That will be the job of the exit region code
			return
		}
		
		self.proximityKit(manager, didDetermineState: beacons.count > 1 ? .inside : .outside, for: region)
	}
	
	enum BeaconError: Error {
		case DuplicateController
	}
}
