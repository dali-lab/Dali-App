//
//  MainViewController.swift
//  
//
//  Created by John Kotz on 6/25/17.
//
//

import Foundation
import UIKit

class MainViewController: UIViewController {
	@IBOutlet weak var daliImage: UIImageView!
	@IBOutlet weak var internalView: UIView!
	
	var viewShown = false
	var loginTransformAnimationDone: Bool!
	
	override func viewDidLoad() {
		UIApplication.shared.statusBarStyle = .lightContent
		self.setNeedsStatusBarAppearanceUpdate()
	}
	
	
	func updateData() {
		
	}
	
	override func viewWillAppear(_ animated: Bool) {
		if !viewShown {
			startAnimation()
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
			UIView.animate(withDuration: 0.5, animations: {
				self.internalView.alpha = 1.0
			})
			self.viewShown = true
		}
	}
}
