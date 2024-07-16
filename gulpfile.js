// GULP MODULES ===============================================================
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var connect = require('gulp-connect');
var less = require('gulp-less');
var jshint = require('gulp-jshint');
var foreach = require("gulp-foreach");
var zip = require("gulp-zip");
var packager = require('electron-packager');
var templateCache = require('gulp-angular-templatecache');
var replace = require('gulp-replace');
var stylish = require('jshint-stylish');
var exec = require('child_process').exec;
var fs = require('fs');
var rimraf = require('rimraf');
var merge = require('merge-stream');



// VARIABLES ==================================================================
var project = JSON.parse(fs.readFileSync('package.json', 'utf8'));
var build_version = project.version;
var build_date = (new Date()).toISOString().replace(/T.*/, '');
var dest = '../defold-b3-editor';

// FILES ======================================================================
var vendor_js = [
  'src/assets/libs/createjs.min.js',
  'src/assets/libs/creatine-1.0.0.min.js',
  'src/assets/libs/behavior3js-0.1.0.min.js',
  'src/assets/libs/mousetrap.min.js',
  'bower_components/angular/angular.min.js',
  'bower_components/angular-animate/angular-animate.min.js',
  'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
  'bower_components/angular-ui-router/release/angular-ui-router.min.js',
  'bower_components/sweetalert/dist/sweetalert.min.js',
];
var vendor_css = [
  'bower_components/bootstrap/dist/css/bootstrap.min.css',
  'bower_components/sweetalert/dist/sweetalert.css',
];
var vendor_fonts = [
  'bower_components/fontawesome/fonts/*',
  'src/assets/fonts/**/*',
];

var preload_js = [
  'src/assets/js/preload.js',
];

var preload_css = [
  'bower_components/fontawesome/css/font-awesome.min.css',
  'src/assets/css/preload.css',
];

var app_js = [
  'src/editor/namespaces.js',
  'src/editor/utils/*.js',
  'src/editor/**/*.js',
  'src/app/app.js',
  'src/app/app.routes.js',
  'src/app/app.controller.js',
  'src/app/**/*.js',
  'src/start.js',
];
var app_less = [
  'src/assets/less/index.less',
];
var app_imgs = [
  'src/assets/imgs/**/*',
];
var app_html = [
  'src/app/**/*.html',
];
var app_entry = [
  'src/index.html',
  'src/package.json',
  'src/desktop.js',
]

// TASKS (VENDOR) =============================================================
gulp.task('_vendor_js', function () {
  return gulp.src(vendor_js)
    .pipe(uglify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest(dest + '/js'))
});

gulp.task('_vendor_css', function () {
  return gulp.src(vendor_css)
    .pipe(minifyCSS())
    .pipe(concat('vendor.min.css'))
    .pipe(gulp.dest(dest + '/css'))
});

gulp.task('_vendor_fonts', function () {
  return gulp.src(vendor_fonts)
    .pipe(gulp.dest(dest + '/fonts'))
});



gulp.task(
  "_vendor",
  gulp.parallel('_vendor_js', '_vendor_css', '_vendor_fonts'),
  done => {
    done();
  }
);


// TASKS (PRELOAD) ============================================================
gulp.task('_preload_js', function () {
  return gulp.src(preload_js)
    .pipe(uglify())
    .pipe(concat('preload.min.js'))
    .pipe(gulp.dest(dest + '/js'))
    .pipe(connect.reload())
});

gulp.task('_preload_css', function () {
  return gulp.src(preload_css)
    .pipe(minifyCSS())
    .pipe(concat('preload.min.css'))
    .pipe(gulp.dest(dest + '/css'))
    .pipe(connect.reload())
});



gulp.task(
  "_preload",
  gulp.parallel('_preload_js', '_preload_css'),
  done => {
    done();
  }
);


// TASKS (APP) ================================================================
gulp.task('_app_js_dev', function () {
  return gulp.src(app_js)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(replace('[BUILD_VERSION]', build_version))
    .pipe(replace('[BUILD_DATE]', build_date))
    .pipe(concat('app.min.js'))
    .pipe(gulp.dest(dest + '/js'))
    .pipe(connect.reload())
});
gulp.task('_app_js_build', function () {
  return gulp.src(app_js)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(replace('[BUILD_VERSION]', build_version))
    .pipe(replace('[BUILD_DATE]', build_date))
    .pipe(uglify())
    .pipe(concat('app.min.js'))
    .pipe(gulp.dest(dest + '/js'))
    .pipe(connect.reload())
});

gulp.task('_app_less', function () {
  return gulp.src(app_less)
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(concat('app.min.css'))
    .pipe(gulp.dest(dest + '/css'))
    .pipe(connect.reload())
});

gulp.task('_app_imgs', function () {
  return gulp.src(app_imgs)
    .pipe(gulp.dest(dest + '/imgs'))
});

gulp.task('_app_html', done => {
  return gulp.src(app_html)
    .pipe(minifyHTML({ empty: true }))
    .pipe(replace('[BUILD_VERSION]', build_version))
    .pipe(replace('[BUILD_DATE]', build_date))
    .pipe(gulp.dest(dest + '/'))
    .pipe(templateCache('templates.min.js', { standalone: true }))
    .pipe(gulp.dest(dest + '/js'))
    .pipe(connect.reload())
});

gulp.task('_app_entry', done => {
  return gulp.src(app_entry)
    // .pipe(minifyHTML({empty:true})) 
    .pipe(replace('[BUILD_VERSION]', build_version))
    .pipe(replace('[BUILD_DATE]', build_date))
    .pipe(gulp.dest(dest + ''))
    .pipe(connect.reload()); 
    
});



gulp.task(
  "_app_dev",
  gulp.parallel('_app_js_dev',
    '_app_less',
    '_app_imgs',
    '_app_html',
    '_app_entry'),
  done => {
    done();
  }
);



gulp.task(
  "_app_build",
  gulp.parallel('_app_js_dev',
    '_app_js_build',
    '_app_less',
    '_app_imgs',
    '_app_html',
    '_app_entry'),
  done => {
    done();
  }
);


// TASKS (LIVE RELOAD) ========================================================
gulp.task('_livereload', function () {
  connect.server({
    livereload: true,
    root: dest,
    port: 8000,
  });
});

gulp.task(
  "_watch",
  gulp.parallel('_livereload'),
  function () {
    gulp.watch(preload_js, gulp.parallel('_preload_js'));
    gulp.watch(preload_css, gulp.parallel('_preload_css'));
    gulp.watch(app_js, gulp.parallel('_app_js_dev'));
    gulp.watch(app_less, gulp.parallel('_app_less'));
    gulp.watch(app_html, gulp.parallel('_app_html'));
    gulp.watch(app_entry, gulp.parallel('_app_entry'));
   
  }
);



// TASKS (NODE WEBKIT) ========================================================






// COMMANDS ===================================================================


gulp.task(
  "build",
  gulp.parallel("_vendor", "_preload", "_app_build"),
  done => {
    done();
  }
);

gulp.task(
  "dev",
  gulp.parallel("_vendor", "_preload", "_app_dev"),
  done => {
    done();
  }
);

gulp.task(
  "serve",
  gulp.parallel("_vendor", "_preload", "_app_dev", '_watch'),
  done => {
    done();
  }
);


gulp.task(
  "_electron",
  gulp.parallel('build'),
  function (cb) {
    packager({
      dir: 'build',
      out: 'temp-dist',
      name: project.name,
      platform: 'linux,win32',
      arch: 'all',
      version: '0.34.2',
      overwrite: true,
      asar: true
    }, function done(err, appPath) {
      cb(err);
    })
  }
);


gulp.task(
  "_electron_zip",
  gulp.parallel('_electron'),
  done => {
    return gulp.src('temp-dist/*')
      .pipe(foreach(function (stream, file) {
        var fileName = file.path.substr(file.path.lastIndexOf("/") + 1);
        gulp.src('temp-dist' + fileName + '/**/*')
          .pipe(zip(fileName + '.zip'))
          .pipe(gulp.dest('dist'));
        return stream;
      }));
  }
);

gulp.task(
  "dist",
  gulp.parallel("_electron_zip"),
  done => {
    done();
  }
); 

