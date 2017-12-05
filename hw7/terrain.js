var canvas;
var gl;
var shader_program;
var height_map = [];
var vertices = [];
var scene_width = 128;
var scene_height = 128;

window.onload = function main()
{
    gl_init();
    compile_shaders();
    gen_height_map();
    vert_height();
    render();
};

/*
 * Transoform t in interval [a,b] to [c,d]
 * f(t) = c + ((d - c) / (b - a)) * (t - a)
 */
function intv(t, a, b, c, d)
{
    return c + ((d - c) / (b - a)) * (t - a);
}
 
/*
 * Initialize gl context
 */
function gl_init()
{
    canvas = document.getElementById("gl_canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
}

/*
 * Compile Shaders
 */
function compile_shaders()
{
    // vertex shader
    var vert_shader = gl.createShader(gl.VERTEX_SHADER);
    var vert_code = document.getElementById("vertex_shader");
    gl.shaderSource(vert_shader, vert_code.text);
    gl.compileShader(vert_shader);
    if (!gl.getShaderParameter(vert_shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vert_shader));
    }

    // fragment shader
    var frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
    var frag_code = document.getElementById("fragment_shader");
    gl.shaderSource(frag_shader, frag_code.text);
    gl.compileShader(frag_shader);
    if (!gl.getShaderParameter(frag_shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(frag_shader));
    }

    // create shader program
    shader_program = gl.createProgram();
    gl.attachShader(shader_program, vert_shader);
    gl.attachShader(shader_program, frag_shader);
    gl.linkProgram(shader_program);
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(shader_program));
    }
    gl.useProgram(shader_program);
}

/*
 * Generate a height map
 */
function gen_height_map()
{
    // generation loop
    for (var x = 0; x < scene_width; x++) {
        var column = [];
        for (var y = 0; y < scene_height; y++) {
            var nx = x / scene_width - 0.5;
            var ny = y / scene_height - 0.5;
            var e = 1 * intv(simplex_noise(1 * nx,  1 * ny), -1, 1, 0, 1) +
                0.5 * intv(simplex_noise(2 * nx, 2 * ny), -1, 1, 0, 1) +
                0.25 * intv(simplex_noise(4 * nx, 2 * ny), -1, 1, 0, 1);
            column.push(Math.pow(e, 1.51));
        }
        height_map.push(column);
    }
}

/*
 * Create vertices based on height map
 */
function vert_height()
{
    for (var i = 0; i < height_map.length; i++) {
        var dim = height_map[i];
        for (var j = 0; j < dim.length; j++) {
            vertices.push([i-scene_width/2, dim[j], j-scene_height/2, 1]);
        }
    }
}

/*
 * Render the scene
 */
function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT);
    // buffer vertices
    var vert_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    var vert_coord = gl.getAttribLocation(shader_program, "coordinate");
    gl.vertexAttribPointer(vert_coord, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vert_coord);
    // draw
    gl.drawArrays(gl.TRIANGLE, 0, vertices.length/4);
}
