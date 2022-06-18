var options = {
    // Customize event to bring up the context menu
    // Possible options https://js.cytoscape.org/#events/user-input-device-events
    evtType: 'cxttap',
    // List of initial menu items
    // A menu item must have either onClickFunction or submenu or both
    menuItems: [
        {
            id: 'add-link',
            content: 'link to',
            tooltipText: 'link to',
            image: {src : "add.svg", width : 12, height : 12, x : 6, y : 4},
            selector: 'node',
            coreAsWell: true,
            onClickFunction: function () {
              console.log('link to');
            }
          }
    //   {
    //     id: 'remove', // ID of menu item
    //     content: 'remove', // Display content of menu item
    //     tooltipText: 'remove', // Tooltip text for menu item
    //     image: {src : "remove.svg", width : 12, height : 12, x : 6, y : 4}, // menu icon
    //     // Filters the elements to have this menu item on cxttap
    //     // If the selector is not truthy no elements will have this menu item on cxttap
    //     selector: 'node, edge', 
    //     onClickFunction: function () { // The function to be executed on click
    //       console.log('remove element');
    //     },
    //     disabled: false, // Whether the item will be created as disabled
    //     show: true, // Whether the item will be shown or not
    //     hasTrailingDivider: true, // Whether the item will have a trailing divider
    //     coreAsWell: false ,// Whether core instance have this item on cxttap
    //     submenu: [] // Shows the listed menuItems as a submenu for this item. An item must have either submenu or onClickFunction or both.
    //   },
    //   {
    //     id: 'hide',
    //     content: 'hide',
    //     tooltipText: 'hide',
    //     selector: 'node, edge',
    //     onClickFunction: function () {
    //       console.log('hide element');
    //     },
    //     disabled: true
    //   },
    //   {
    //     id: 'add-node',
    //     content: 'add node',
    //     tooltipText: 'add node',
    //     image: {src : "add.svg", width : 12, height : 12, x : 6, y : 4},
    //     selector: 'node',
    //     coreAsWell: true,
    //     onClickFunction: function () {
    //       console.log('add node');
    //     }
    //   }
    ],
    // css classes that menu items will have
    menuItemClasses: [
      // add class names to this list
    ],
    // css classes that context menu will have
    contextMenuClasses: [
      // add class names to this list
    ],
    // Indicates that the menu item has a submenu. If not provided default one will be used
    submenuIndicator: { src: 'assets/submenu-indicator-default.svg', width: 12, height: 12 }
};

export default options;