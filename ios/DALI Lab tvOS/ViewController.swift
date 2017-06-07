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
    
    let text = self.peopleInLabLabel.text!
    self.peopleInLabLabel.text = text +  "  -  "
    wrapLabel.textColor = self.peopleInLabLabel.textColor
    wrapLabel.font = self.peopleInLabLabel.font
    wrapLabel.text = text
    wrapLabel.sizeToFit()
    peopleInLabLabel.sizeToFit()
    wrapLabel.frame = CGRect(x: self.peopleInLabLabel.frame.width, y: self.peopleInLabLabel.frame.origin.y, width: wrapLabel.frame.width, height: wrapLabel.frame.height)
    
    self.peopleInLabView.addSubview(wrapLabel)
    
    self.peopleInLabLabel.sizeToFit()
    self.animatePeopleInLab()
  }
  
  func animatePeopleInLab() {
    let peopleInLabStartFrame = self.peopleInLabLabel.frame
    let wrapLabelStartFrame = self.wrapLabel.frame
//    self.peopleInLabLabel.backgroundColor = UIColor.blue
//    self.wrapLabel.backgroundColor = UIColor.red
    UIView.animate(withDuration: 12.0, delay: 1, options: ([.curveLinear]), animations: {() -> Void in
      self.peopleInLabLabel.center = CGPoint(x: 0 - self.peopleInLabLabel.bounds.size.width / 2, y: self.peopleInLabLabel.center.y)
      self.wrapLabel.center = CGPoint(x: 0 + self.wrapLabel.bounds.size.width / 2, y: self.wrapLabel.center.y)
    }, completion:  { _ in
//      self.animatePeopleInLab()
      self.wrapLabel.frame = wrapLabelStartFrame
      self.peopleInLabLabel.frame = peopleInLabStartFrame
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

