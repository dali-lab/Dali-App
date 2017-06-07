//
//  ServerCommunicator.swift
//  DALI Lab tvOS
//
//  Created by John Kotz on 6/6/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import Foundation

class ServerCommunicator {
  struct Event: Codable {
    let name: String!
    let startTime: Date!
    let endTime: Date!
    let description: String!
  }
  
  enum WeekDay: String {
    case Sun
    case Mon
    case Tues
    case Wed
    case Thurs
    case Fri
    case Sat
    
    static func all() -> [WeekDay] {
      return [.Sun, .Mon, .Tues, .Wed, .Thurs, .Fri, .Sat]
    }
    
    func long() -> String {
      switch self {
      case .Sun:
        return "Sunday"
      case .Mon:
        return "Monday"
      case .Tues:
        return "Tuesday"
      case .Wed:
        return "Wednesday"
      case .Thurs:
        return "Thursday"
      case .Fri:
        return "Friday"
      case .Sat:
        return "Saturday"
      }
    }
  }
  
  /**
   * Gets the upcoming events and calls the given function with the data when complete
   */
  static func getEvents(_ callback: @escaping (_ events : [Event]) -> Void) {
    DispatchQueue(label: "getEvents").async {
      let events = [
          Event(name: "tvOS App starts working?", startTime: Date(), endTime: Date(timeIntervalSinceNow: 40000), description: "This is a cool description"),
          Event(name: "Cool events start happening", startTime: Date(timeIntervalSinceNow: 40000), endTime: Date(timeIntervalSinceNow: 600000), description: "At this point good events are going to start happening"),
          Event(name: "Cool events stop happening", startTime: Date(timeIntervalSinceNow: 90000), endTime: Date(timeIntervalSinceNow: 100000), description: "Events will stop happening from now on :(")
      ]
      
      DispatchQueue.main.async {
        callback(events)
      }
    }
  }
  
  static func getLabHours() {
    
  }
}
