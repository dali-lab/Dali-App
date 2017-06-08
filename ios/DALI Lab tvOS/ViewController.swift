//
//  ViewController.swift
//  DALI Lab tvOS
//
//  Created by John Kotz on 6/6/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import UIKit

class ViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
  @IBOutlet weak var tableView: UITableView!
  @IBOutlet weak var image: UIImageView!
  @IBOutlet weak var peopleInLabLabel: UILabel!
  @IBOutlet weak var peopleInLabView: UIView!
  let wrapLabel = UILabel()
  let fadeIn = #imageLiteral(resourceName: "Fadein")
  let fadeOut = #imageLiteral(resourceName: "Fadeout")
  let nonFaded = #imageLiteral(resourceName: "nonFaded")
  
  var events : [ServerCommunicator.Event]?
  
  override func viewDidLoad() {
    super.viewDidLoad()
    // Do any additional setup after loading the view, typically from a nib.
    ServerCommunicator.getEvents { (events) in
      self.events = events.sorted(by: { (event: ServerCommunicator.Event, event2: ServerCommunicator.Event) -> Bool in
        return event.startTime < event2.startTime
      })
      self.tableView.reloadData()
    }
    
    let text = "People in the lab: John Kotz, Tim Tregubov, Andrew Beaubien, Jenny Seong, sjdkfla;skdjflk asjdfklja kl;sdfj;lajsd fl;kjasldkfa ;sx"
    self.peopleInLabLabel.text = text
    
    
    let mask = CALayer()
    let fadeInLayer = CALayer()
    fadeInLayer.contents = fadeIn.cgImage
    fadeInLayer.frame = CGRect(x: 0, y: 0, width: fadeIn.size.width, height: fadeIn.size.height)
    mask.addSublayer(fadeInLayer)
    
    let fadeOutLayer = CALayer()
    fadeOutLayer.contents = fadeOut.cgImage
    fadeOutLayer.frame = CGRect(x: self.peopleInLabView.frame.width - fadeOut.size.width, y: 0, width: fadeOut.size.width, height: self.peopleInLabView.frame.height)
    mask.addSublayer(fadeOutLayer)
    
    let nonFadedLayer = CALayer()
    nonFadedLayer.contents = nonFaded.cgImage
    nonFadedLayer.frame = CGRect(x: fadeIn.size.width, y: 0, width: self.peopleInLabView.frame.width - (fadeOut.size.width + fadeIn.size.width), height: self.peopleInLabView.frame.height)
    mask.addSublayer(nonFadedLayer)
    
    mask.frame = self.peopleInLabView.bounds
    self.peopleInLabView.layer.mask = mask
    
    self.peopleInLabLabel.sizeToFit()
    if self.peopleInLabLabel.frame.width >= self.peopleInLabView.frame.width {
      self.peopleInLabLabel.text = text + "  -   "
      wrapLabel.text = text
      wrapLabel.textColor = self.peopleInLabLabel.textColor
      wrapLabel.font = self.peopleInLabLabel.font
      wrapLabel.sizeToFit()
      peopleInLabLabel.sizeToFit()
      wrapLabel.frame = CGRect(x: self.peopleInLabLabel.frame.width, y: self.peopleInLabLabel.frame.origin.y, width: wrapLabel.frame.width, height: wrapLabel.frame.height)
      peopleInLabLabel.textAlignment = .left
      wrapLabel.textAlignment = .left
      
      self.peopleInLabView.addSubview(wrapLabel)
      self.animatePeopleInLab()
    }else{
      self.peopleInLabLabel.frame = CGRect(x: 0, y: 0, width: self.peopleInLabView.frame.width, height: self.peopleInLabLabel.frame.height)
    }
  }
  
  func animatePeopleInLab() {
    UIView.animate(withDuration: 12.0, delay: 1, options: ([.curveLinear]), animations: {() -> Void in
      let translation = CGAffineTransform(translationX: -self.peopleInLabLabel.bounds.size.width, y: 0)
      self.wrapLabel.transform = translation
      self.peopleInLabLabel.transform = translation
    }, completion:  { _ in
      self.wrapLabel.transform = CGAffineTransform(translationX: 0, y: 0)
      self.peopleInLabLabel.transform = CGAffineTransform(translationX: 0, y: 0)
      self.animatePeopleInLab()
    })
  }
  
  override func didReceiveMemoryWarning() {
    super.didReceiveMemoryWarning()
    // Dispose of any resources that can be recreated.
  }
  
  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "eventCell") as! EventCell
    cell.event = events?[indexPath.row]
    return cell
  }
  
  func numberOfSections(in tableView: UITableView) -> Int {
    return 1
  }
  
  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    return events?.count ?? 0
  }
}

