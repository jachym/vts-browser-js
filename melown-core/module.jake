var files = [
    'config.js',
    'core.js',
    'interface.js',
    'update.js',
    '_nominify.js',
    '_minify.js',
    '_minify_sez.js',

    'inspector/graphs.js',
    'inspector/input.js',
    'inspector/inspector.js',
    'inspector/stats.js',

    'map/bound-layer.js',
    'map/cache.js',
    'map/camera.js',
    'map/config.js',
    'map/credit.js',
    'map/draw.js',
    'map/division-node.js',
    'map/free-layer.js',
    'map/glue.js',
    'map/interface.js',
    'map/loader.js',
    'map/map.js',
    'map/measure.js',
    'map/mesh.js',
    'map/metanode-tracer.js',
    'map/metanode.js',
    'map/metastorage.js',
    'map/metatile.js',
    'map/position.js',
    'map/refframe.js',
    'map/srs.js',
    'map/stats.js',
    'map/submesh.js',
    'map/surface.js',
    'map/texture.js',
    'map/tile.js',
    'map/tree.js',
    'map/url.js',
    'map/view.js',

    'map/geodata/processor.js',
    'map/geodata/worker-debug.js',
    'map/geodata/worker-globals.js',
    'map/geodata/worker-linestring.js',
    'map/geodata/worker-main.js',
    'map/geodata/worker-pointarray.js',
    'map/geodata/worker-style.js',
    'map/geodata/worker-text.js',

    'renderer/bbox.js',
    'renderer/camera.js',
    'renderer/draw.js',
    'renderer/geometry.js',
    'renderer/init.js',
    'renderer/interface.js',
    'renderer/renderer.js',

    'renderer/gpu/bbox.js',
    'renderer/gpu/device.js',
    'renderer/gpu/font.js',
    'renderer/gpu/geodata.js',
    'renderer/gpu/group.js',
    'renderer/gpu/line.js',
    'renderer/gpu/mesh.js',
    'renderer/gpu/pixel-line.js',
    'renderer/gpu/pixel-line3.js',
    'renderer/gpu/polygon.js',
    'renderer/gpu/program.js',
    'renderer/gpu/shaders.js',
    'renderer/gpu/text.js',
    'renderer/gpu/texture.js',
    'renderer/gpu/tile.js',

    'utils/math.js',
    'utils/matrix.js',
    'utils/platform.js',
    'utils/utils.js',
    'utils/url.js',
    'utils/http.js',
    
    'utils/libs/geographics-full.js',
    'utils/libs/proj4.js',
    'utils/libs/proj4-src.js',
];

addSiteModule('melown-core-api-devel', files, {});
