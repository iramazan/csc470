var canvas;
var gl;
var shader_program;
var height_map = [];

window.onload = function main()
{
    gl_init();
    compile_shaders();
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
    gl.clearColor(0, 0, 0, 0);
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
function height_map()
{
    var width = 512;
    var height = 512;
    // generation loop
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var nx = x / width - 0.5;
            var ny = y / height - 0.5;
            var e = 1 * simplex_noise(1 * nx,  1 * ny) +
                0.5 * simplex_noise(2 * nx, 2 * ny) +
                0.25 * simplex_noise(4 * nx, 2 * ny);
            height_map[y][x] = Math.pow(e, 1.51);
        }
    }
}
