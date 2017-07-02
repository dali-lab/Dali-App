//
//  AppDelegate.swift
//  DALISwift
//
//  Created by John Kotz on 6/23/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, GIDSignInDelegate {

	var window: UIWindow?
	var user: GIDGoogleUser?
	var loginViewController: LoginViewController?
	var inBackground = false

	func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
		// Override point for customization after application launch.
		UIApplication.shared.statusBarStyle = .lightContent
		
		var error: NSError? = nil
		GGLContext.sharedInstance().configureWithError(&error)
	
		assert(error == nil)
		
		
		GIDSignIn.sharedInstance().delegate = self
		GIDSignIn.sharedInstance().signInSilently()

		return true
	}
	
	func sign(_ signIn: GIDSignIn!, didSignInFor user: GIDGoogleUser!, withError error: Error!) {
		if let error = error {
			print(error)
		}else{
			print("Signed in successfuly")
			self.user = user
			
			let mainViewController = UIStoryboard(name: "Main", bundle: nil).instantiateViewController(withIdentifier: "MainViewController") as! MainViewController
			
			if let loginViewController = self.loginViewController {
				
				mainViewController.modalTransitionStyle = .crossDissolve
				mainViewController.modalPresentationStyle = .fullScreen
				mainViewController.loginTransformAnimationDone = loginViewController.transformAnimationDone
				
				loginViewController.present(mainViewController, animated: true, completion: {
					
				})
			}else{
				self.window?.rootViewController = mainViewController
			}
		}
	}
	
	func skipSignIn() {
		let mainViewController = UIStoryboard(name: "Main", bundle: nil).instantiateViewController(withIdentifier: "MainViewController") as! MainViewController
		
		mainViewController.modalTransitionStyle = .crossDissolve
		mainViewController.modalPresentationStyle = .fullScreen
		mainViewController.loginTransformAnimationDone = loginViewController?.transformAnimationDone
		
		loginViewController?.present(mainViewController, animated: true, completion: {
			
		})
	}
	
	func sign(_ signIn: GIDSignIn!, didDisconnectWith user: GIDGoogleUser!, withError error: Error!) {
		print("Disconnected!")
	}
	
	func signOut() {
		GIDSignIn.sharedInstance().signOut()
		self.window?.rootViewController?.dismiss(animated: true, completion: {
			
		})
	}
	
	func application(_ app: UIApplication, open url: URL, options: [UIApplicationOpenURLOptionsKey : Any] = [:]) -> Bool {
		return GIDSignIn.sharedInstance().handle(url, sourceApplication: options[.sourceApplication] as? String, annotation: options)
	}

	func applicationWillResignActive(_ application: UIApplication) {
		// Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
		// Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
	}

	func applicationDidEnterBackground(_ application: UIApplication) {
		// Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
		// If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
		inBackground = true
		print("Entering Background")
		
		// Notify the rest of the app
		NotificationCenter.default.post(name: NSNotification.Name(rawValue: "enterBackground"), object: nil)
	}

	func applicationWillEnterForeground(_ application: UIApplication) {
		// Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
	}

	func applicationDidBecomeActive(_ application: UIApplication) {
		// Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
		if inBackground {
			print("Returning from Background")
			inBackground = false
			
			// Notify the rest of the app
			NotificationCenter.default.post(name: NSNotification.Name(rawValue: "returnFromBackground"), object: nil)
		}
	}

	func applicationWillTerminate(_ application: UIApplication) {
		// Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
	}


}

