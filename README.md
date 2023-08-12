# AutoLanPhone
Do you have a bunch of old Cisco phones lying around? Do you love the sound of phones ringing up until 4am in the morning? AutoLanPhone is for you!

AutoLanPhone provides a ~~knockoff seat picker~~ state-of-the-art Web application that allows you to design your LAN, placing players, walkways, and most importantly - **phones.**

## Installation

Just clone the repository, run `npm install` and then `npm start`! You will then be able to access the Web Planner on http://localhost:3000/. 

You can also set the environment variable `LAN_PORT` if you want to run on a port other than 3000, though... why?

## Usage

### Web Planner

The Web Planner allows you to map out your venue in a grid. It is 13x7 by default - you can change this in [main.js](static/js/main.js). It also assumes your venue is set up so that people are in pairs.

There are four options: player, phone, walkway, & wall. Once you click the button for that option, you can click squares in the grid to place & unplace that specific type. You can click "reset" to exit this mode.

You can rotate a grid square left, and rotate it back to middle. Other directions are a WIP.

#### Players

A player represents a person / setup at your venue. A player can have a name, which should be the name of the person sitting in that position. A player can be in the same position as a Phone.

#### Phones

A phone represents a phone sitting at someone's desk. Each phone should be configured with a MAC address and a phone type. The phone type defaults to a Cisco 7970.

#### Walls and Walkways

Walls & walkways have no purpose other than for visualisation & decoration.

### Ansible Hosts Generation

Once you've mapped out your venue and correctly named each player and phone, you can click the "Convert" button.

The conversion will then assign each player a partner, and then for each phone it will figure out who it belongs to. If the desk it is placed at has two people, it will show both of their names.

This data is then sent to the Express server via a POST request. The POST server then takes the [template.yaml](ansible/template.yaml), and adds all the phones that it has successfully mapped.

Each phone will then be given an incremental extension, and an 8-digit password. Each phone will have 7 quick dial lines generated, with the furthest away phones being higher on the list than ones that are closer.

## Todo List

- [ ] Implement support with FreePBX API to add extensions to the server
- [ ] Include Ansible playbooks that use the generated hosts file to allow configuration of phones
- [ ] Include automation to run Ansible playbook on generation, and restart phones
- [ ] Ensure generated extension numbers never include emergency numbers, like "999"
- [ ] Allow resizing of planner, to allow for venues of bigger sizes
- [ ] Allow planner to define groups of people and quick dial rules, in case they have special logic for who they should be able to call (mostly for Artemis)
- [ ] Maybe some automation to allow importing seating positions?
- [ ] Save planner data in database rather than in local storage - or at least, allow exporting the planner data.