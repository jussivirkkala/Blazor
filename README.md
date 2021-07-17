# EDF

Blazor https://blazor.net  WebAssembly (WASM) app to read EDF https://www.edfplus.info/ header information. Progressive web app (PWA) for offline use in any mobile, PC, Mac browser. File is analyzed locallyIt is hosted on https://www.virkkala.net/blazor/edf source code https://github.com/jussivirkkala/BlazorEDF.

There are minimal changes to 

![EDF-1](EDF-1.png)

Extra navigation are commented out using `@*` in MainLayout.razor

```
@inherits LayoutComponentBase

<div class="page">
    @*
        <div class="sidebar">
            <NavMenu />
        </div>
    *@
    <div class="main">
        @*
        <div class="top-row px-4">
            <a href="http://blazor.net" target="_blank" class="ml-md-auto">About</a>
        </div>
        *@
        <div class="content px-4">
            @Body
        </div>
    </div>
</div>
``` 
All other changes are done into Index.razor
```
@page "/"
@*
    Displaying EDF file header information
    @jussivirkkala
    2021-07-17 First version

    https://www.edfplus.info/specs/edf.html
    HEADER RECORD (we suggest to also adopt the 12 simple additional EDF+ specs)
    8 ascii : version of this data format (0)
    80 ascii : local patient identification (mind item 3 of the additional EDF+ specs)
    80 ascii : local recording identification (mind item 4 of the additional EDF+ specs)
    8 ascii : startdate of recording (dd.mm.yy) (mind item 2 of the additional EDF+ specs)
    8 ascii : starttime of recording (hh.mm.ss)
    8 ascii : number of bytes in header record
    44 ascii : reserved
    8 ascii : number of data records (-1 if unknown, obey item 10 of the additional EDF+ specs)
    8 ascii : duration of a data record, in seconds
    4 ascii : number of signals (ns) in data record
    ns * 16 ascii : ns * label (e.g. EEG Fpz-Cz or Body temp) (mind item 9 of the additional EDF+ specs)
    ns * 80 ascii : ns * transducer type (e.g. AgAgCl electrode)
    ns * 8 ascii : ns * physical dimension (e.g. uV or degreeC)
    ns * 8 ascii : ns * physical minimum (e.g. -500 or 34)
    ns * 8 ascii : ns * physical maximum (e.g. 500 or 40)
    ns * 8 ascii : ns * digital minimum (e.g. -2048)
    ns * 8 ascii : ns * digital maximum (e.g. 2047)
    ns * 80 ascii : ns * prefiltering (e.g. HP:0.1Hz LP:75Hz)
    ns * 8 ascii : ns * nr of samples in each data record
    ns * 32 ascii : ns * reserved
*@

<InputFile id="inputDefault"
           OnChange="OnFileSelection"
           accept=".edf,.rec" />
<br>
@if (header != null)
{
<label>
    version: @header.version
    <br>patient: @header.patient
    <br>recording: @header.recording
    <br>startdate (dd.mm.yy): @header.startdate
    <br>starttime (hh.mm.ss): @header.starttime
    <br>headerlength (256+signals*256): @header.headerlength
    <br>reserved 44: @header.reserved44
    <br>data records (-1 if unknown): @header.records
    <br>record duration (s): @header.duration
    <br>number of signals: @header.signals
</label>
}

@if (signals != null)
{
@foreach (var signal in signals)
    {
<br>
<label>
    label (dimension): @signal.label (@signal.dimension)
    <br>transducer type: @signal.transducer
    <br>physical min max: @signal.physicalMin @signal.physicalMax
    <br>physical min max: @signal.digitalMin @signal.digitalMax
    <br>prefiltering: @signal.prefiltering
    <br>samples: @signal.samples
    <br>reserved: @signal.reserved32
</label>
    }
}
<br>
<a href="https://blazor.net">https://blazor.net</a>  WebAssembly (WASM) app to read 
<a href="https://www.edfplus.info/">https://www.edfplus.info/</a>  header information. 
Progressive web app (PWA) for offline use in any mobile, PC, Mac browser. File is analyzed locally. 
App is hosted on <a href="https://www.virkkala.net/blazor/edf">https://www.virkkala.net/blazor/edf</a> and 
source code in <a href="https://github.com/jussivirkkala/BlazorEDF">https://github.com/jussivirkkala/BlazorEDF</a>

@code {
    const int MAXSIZE = 1000000000;
    private edfHeader header;
    private edfSignal[] signals;
    private bool signals_ready = false;

    public class edfHeader
    {
        public string version { get; set; }
        public string patient { get; set; }
        public string recording { get; set; }
        public string startdate { get; set; }
        public string starttime { get; set; }
        public string headerlength { get; set; }
        public string reserved44 { get; set; }
        public string records { get; set; }
        public string duration { get; set; }
        public string signals { get; set; }
    }

    public class edfSignal
    {
        public string label { get; set; }
        public string transducer { get; set; }
        public string dimension { get; set; }
        public string physicalMin { get; set; }
        public string physicalMax { get; set; }
        public string digitalMin { get; set; }
        public string digitalMax { get; set; }
        public string prefiltering { get; set; }
        public string samples { get; set; }
        public string reserved32 { get; set; }
    }

    private async Task OnFileSelection(InputFileChangeEventArgs e)
    {
        header = new edfHeader();
        IBrowserFile file = e.File;
        // Header 256 bytes
        var bytes = new byte[256 + 100 * 256];
        int i = 0;
        await file.OpenReadStream(MAXSIZE).ReadAsync(bytes, 0, bytes.Length);
        header.version = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        header.patient = System.Text.Encoding.UTF8.GetString(bytes, i, 80); i += 80;
        header.recording = System.Text.Encoding.UTF8.GetString(bytes, i, 80); i += 80;
        header.startdate = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        header.starttime = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        header.headerlength = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        header.reserved44 = System.Text.Encoding.UTF8.GetString(bytes, i, 44); i += 44;
        header.records = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        header.duration = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        header.signals = System.Text.Encoding.UTF8.GetString(bytes, i, 4); i += 4;
        int n = Int32.Parse(header.signals);

        signals = new edfSignal[n];
        int j;
        for (j = 0; j < n; j += 1) {
            signals[j] = new edfSignal();
            signals[j].label = System.Text.Encoding.UTF8.GetString(bytes, i, 16); i += 16;
        }
        for (j = 0; j < n; j += 1) {
            signals[j].transducer = System.Text.Encoding.UTF8.GetString(bytes, i, 80); i += 80;
        }
        for (j = 0; j < n; j += 1) {
            signals[j].dimension = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1) {
            signals[j].physicalMin = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1) {
            signals[j].physicalMax = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1) {
            signals[j].digitalMin = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1) {
            signals[j].digitalMax = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1) {
            signals[j].prefiltering = System.Text.Encoding.UTF8.GetString(bytes, i, 80); i += 80;
        }
        for (j = 0; j < n; j += 1) {
            signals[j].samples = System.Text.Encoding.UTF8.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1) {
            signals[j].reserved32 = System.Text.Encoding.UTF8.GetString(bytes, i, 32); i += 32;
        }
    }
}

```

End
