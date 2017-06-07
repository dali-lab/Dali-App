//
//  EventCell.swift
//  DALI Lab tvOS
//
//  Created by John Kotz on 6/6/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import Foundation
import UIKit

class EventCell: UITableViewCell {
    @IBOutlet weak var nameLabel: UILabel!
    @IBOutlet weak var descriptionLabel: UILabel!
    @IBOutlet weak var dateLabel: UILabel!
    
    var event: ServerCommunicator.Event? {
    set {
        if let newValue = newValue {
          nameLabel.text = newValue.name
          descriptionLabel.text = newValue.description
          
          let calendar = Calendar.current
          
          let weekDayIndex = calendar.component(.weekday, from: newValue.startTime)
          let weekDay = ServerCommunicator.WeekDay.all()[weekDayIndex]
          let day = calendar.component(.day, from: newValue.startTime)
          let dayPostFix = getDayPostFix(day: day)
          
          dateLabel.text = """
          \(weekDay.rawValue), \(String(day) + dayPostFix)
          \(newValue.startTime.timeString()) - \(newValue.endTime.timeString())
          """
        }
    }
    get {
      return nil
    }
  }
  
  fileprivate func getDayPostFix(day: Int) -> String {
    switch day {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
    }
  }
}

extension Date {
  func timeString() -> String {
    let minutes = Calendar.current.component(.minute, from: self)
    let hours = Calendar.current.component(.hour, from: self)
    return "\(hours % 13)\(minutes != 0 ? ":\(minutes < 10 ? "0" : "")\(minutes)" : "") \(hours >= 12 && hours < 24 ? "PM" : "AM")"
  }
}
