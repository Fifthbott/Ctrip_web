'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('travel_logs', 'thumbnail_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: '视频缩略图URL（当有视频时使用）'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('travel_logs', 'thumbnail_url');
  }
};
