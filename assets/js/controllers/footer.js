controllers.controller('footerCtrl', function () {
    var ctrl = this;
    ctrl.buttons = [
        { 'icon': 'class', 'text': 'My Classroom' },
        { 'icon': 'stars', 'text': 'Popular' },
        { 'icon': 'new_releases', 'text': 'New Releases' },
        { 'icon': 'notifications', 'text': 'My Dashboard' }
    ];
    ctrl.contactUsLink = 'mailto:Admin@FlyHighTraining.com&subject=' +
      encodeURIComponent('Fly High Training Portal Feedback') +
      '&body=' + encodeURIComponent('Please provide questions, comments or feedback here: \n\n');
});
