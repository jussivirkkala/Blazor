# EDF

2021-09-02 Blazor https://blazor.net  WebAssembly (WASM) app to read EDF https://www.edfplus.info/ header information. Progressive web app (PWA) for offline use in any mobile, PC, Mac browser. File is analyzed locally. It is hosted on https://www.virkkala.net/blazor/edf and source code in https://github.com/jussivirkkala/Blazor. Use Ctrl+F5 to force refresh. Install as PWA by clicking icon in end of browser address bar.

![EDF-1](EDF-0.png)

Select EDF file e.g. from https://physionet.org/about/database/. Examples https://physionet.org/content/siena-scalp-eeg/1.0.0/PN00/PN00-1.edf.  

![EDF-2](EDF-1.png)

You can copy header to clipboard or download as ascii [PN00-1.edf.txt](PN00-1.edf.txt)

# Code

There are minimal changes to default Blazor template. You can use .NET5 SDK https://dotnet.microsoft.com/ to run app: 

```
dotnet watch run

```

Extra navigation are commented out using `@*` in [Shared/MainLayout.razor](Shared/MainLayout.razor).

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
Other changes are done into [Pages/Index.razor](Pages/Index.razor)
```
@page "/"
@using System.IO
@using System.Threading

@inject IJSRuntime JSRuntime
@*
    Displaying EDF file header information
    @jussivirkkala
    2021-07-26 overscroll-behavior: none;
    2021-07-25 Corrected size in export. Removed Ctrl+C in file export.
    2021-07-24 Indicating problem with large files. Body overflow-y:hidden.
    2021-07-23 No decimals for fixed sampling rate, length as hh:mm:ss. Displaying modified, size. Two buttons.
    2021-07-22 Adding length, sampling rate to clipboard. Corrected clipboard.
    2021-07-21 Resetting signals. Using ParseTry, download, clipboard.
    2021-07-20 BDF, .ASCII encoding, calculate file duration, sampling rate, check version.
    2021-07-19 Version date. Path www.github.com/jussivirkkala/Blazor.
    2021-07-18 Corrected digital label. Max file size 5 GB, 256 channels.
    2021-07-17 First version.

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
           accept=".edf,.rec,.bdf" />
<br>
@if (header != null)
{
    <label>
        Modified: @header.modified Size: @header.size
        @if (filesize > 2000000000)
        {
            <label><br />, large files can not be read correctly!</label>
        }
        <br>Version: @header.version
        <br>Patient: @header.patient
        <br>Recording: @header.recording
        <br>Start date (dd.mm.yy): @header.startdate
        <br>Start time (hh.mm.ss): @header.starttime
        <br>Header length: @header.headerlength
        <br>Reserved: @header.reserved44
        <br>Data records: @header.records
        <br>Record duration (s): @header.duration; File duration (hh:mm:ss): @TimeSpan.FromSeconds(header.length).TotalHours.ToString("00"):@TimeSpan.FromSeconds(header.length).ToString(@"mm\:ss")
        <br>Number of signals: @header.signals
    </label>

}

@if (signals != null)
{
    <br />
    <button @onclick="CtrlC">Ctrl+C</button>
    <button @onclick="saveFile">@(header.filename).txt</button>

    @foreach (var signal in signals)
    {
        <br>
        <label>
            Label (dimension): @signal.label (@signal.dimension)
            <br>Transducer type: @signal.transducer
            <br>Physical min max: @signal.physicalMin @signal.physicalMax
            <br>Digital min max: @signal.digitalMin @signal.digitalMax
            <br>Prefiltering: @signal.prefiltering
            <br>Samples: @signal.samples; Sampling rate (Hz): @signal.samplingrate.ToString("0.####", CultureInfo.InvariantCulture)
            <br>Reserved: @signal.reserved32
        </label>
    }
}
<br>
2021-07-26 <a href="https://blazor.net">https://blazor.net</a>  WebAssembly (WASM) app to read EDF
<a href="https://www.edfplus.info/">https://www.edfplus.info/</a> and BDF  header information.
Progressive web app (PWA) for offline use in modern mobile, PC, Mac browser. File is analyzed locally.
App is hosted on <a href="https://www.virkkala.net/blazor/edf">https://www.virkkala.net/blazor/edf</a> and
source code in <a href="https://github.com/jussivirkkala/Blazor">https://github.com/jussivirkkala/Blazor</a>

@code {
    private edfHeader header;
    private edfSignal[] signals;
    private string txt;
    private long filesize = 0;

    public class edfHeader
    {
        public string filename { get; set; }
        public string modified { get; set; }
        public string size { get; set; }
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
        public double length { get; set; }
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
        public double samplingrate { get; set; }
    }

    private async Task OnFileSelection(InputFileChangeEventArgs e)
    {
        header = new edfHeader();
        if (signals != null) signals = null;
        IBrowserFile file = e.File;
        header.filename = e.File.Name;

        // Header 256 bytes
        var bytes = new byte[256 + 256 * 256]; // Max 256 channels
        int i = 0;
        const long MAXSIZE = 4294967296; // 4 GB, FAT32 limit
        await file.OpenReadStream(MAXSIZE).ReadAsync(bytes, 0, bytes.Length);
        /* Problem reading 2 GB files?
        using (Stream SourceStream = file.OpenReadStream(MAXSIZE))
        {
            await SourceStream.ReadAsync(bytes, 0, 256 + 256 * 256);
        }
        */
        const string LF = "\r\n";
        txt = "File\t" + header.filename + LF;
        string s;
        s = e.File.LastModified.ToString("yyyy-MM-ddTHH\\:mm\\:ss");
        header.modified = s;
        txt += "Modified\t" + s + LF;
        filesize = e.File.Size;
        s = filesize.ToString();
        header.size = s;
        txt += "Size\t" + s + LF;
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 8); i += 8;
        header.version = s; // BitConverter.ToString(bytes, 0, 8);
        txt += "Version\t" + s + LF;
        if (header.version.CompareTo("0       ") != 0)
        {
            // header.version = "Not correct EDF/BDF file";
            // return;
        }
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 80); i += 80;
        header.patient = s;
        txt += "Patient\t" + s + LF;
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 80); i += 80;
        header.recording = s;
        txt += "Recording\t" + s + LF;
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 8); i += 8;
        header.startdate = s;
        txt += "Start date (dd.mm.yy)\t" + s + LF;
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 8); i += 8;
        header.starttime = s;
        txt += "Start time (hh.mm.ss)\t" + s + LF;
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 8); i += 8;
        header.headerlength = s;
        txt += "Header length\t" + s + LF;
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 44); i += 44;
        header.reserved44 = s;
        txt += "Reserved\t" + s + LF;
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 8); i += 8;
        header.records = s;
        txt += "Records\t" + s + LF;
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 8).TrimEnd(); i += 8;
        header.duration = s;
        txt += "Record duration\t" + s + LF;
        s = System.Text.Encoding.ASCII.GetString(bytes, i, 4); i += 4;
        header.signals = s;
        txt += "Signals\t" + s + LF;
        uint n = UInt32.Parse(s); //
        double duration;
        if (double.TryParse(header.duration, NumberStyles.Float, CultureInfo.InvariantCulture, out duration))
        {
            // duration = Double.Parse(header.duration); // signal record duration, usually 1 s
            uint r = UInt32.Parse(header.records);
            header.length = duration * r;
        }
        else
            header.length = -1;
        txt += "File duration (hh:mm:ss)\t" + TimeSpan.FromSeconds(header.length).TotalHours.ToString("00") + ":" + TimeSpan.FromSeconds(header.length).ToString(@"mm\:ss") + LF;

        signals = new edfSignal[n];
        int j;
        for (j = 0; j < n; j += 1)
        {
            signals[j] = new edfSignal();
            signals[j].label = System.Text.Encoding.ASCII.GetString(bytes, i, 16); i += 16;
        }
        for (j = 0; j < n; j += 1)
        {
            signals[j].transducer = System.Text.Encoding.ASCII.GetString(bytes, i, 80); i += 80;
        }
        for (j = 0; j < n; j += 1)
        {
            signals[j].dimension = System.Text.Encoding.ASCII.GetString(bytes, i, 8).TrimEnd(); i += 8;
        }
        for (j = 0; j < n; j += 1)
        {
            signals[j].physicalMin = System.Text.Encoding.ASCII.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1)
        {
            signals[j].physicalMax = System.Text.Encoding.ASCII.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1)
        {
            signals[j].digitalMin = System.Text.Encoding.ASCII.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1)
        {
            signals[j].digitalMax = System.Text.Encoding.ASCII.GetString(bytes, i, 8); i += 8;
        }
        for (j = 0; j < n; j += 1)
        {
            signals[j].prefiltering = System.Text.Encoding.ASCII.GetString(bytes, i, 80); i += 80;
        }
        for (j = 0; j < n; j += 1)
        {
            signals[j].samples = System.Text.Encoding.ASCII.GetString(bytes, i, 8).TrimEnd(); i += 8;
            signals[j].samplingrate = UInt16.Parse(signals[j].samples) / duration;
        }
        for (j = 0; j < n; j += 1)
        {
            signals[j].reserved32 = System.Text.Encoding.ASCII.GetString(bytes, i, 32); i += 32;
        }
        txt += "Label\tTransducer\tDimension\tPhysicalMin\tPhysicalMax\tDigitalMin\tDigitalMax\tPrefiltering\tSamples\tReserved\tSamplingRate" + LF;
        for (j = 0; j < n; j += 1)
        {
            txt += signals[j].label.TrimEnd() + "\t" + signals[j].transducer.TrimEnd() + "\t" + signals[j].dimension.TrimEnd() + "\t" + signals[j].physicalMin.TrimEnd() + "\t" + signals[j].physicalMax.TrimEnd() + "\t" +
                signals[j].digitalMin.TrimEnd() + "\t" + signals[j].digitalMax.TrimEnd() + "\t" + signals[j].prefiltering.TrimEnd() + "\t" + signals[j].samples.TrimEnd() + "\t" + signals[j].reserved32.TrimEnd() + "\t" +
                signals[j].samplingrate.ToString("0.####", CultureInfo.InvariantCulture) + LF;
        }
    }

    // https://www.syncfusion.com/faq/blazor/general/how-do-i-generate-and-save-a-file-client-side-using-blazor
    public async void saveFile()
    {
        await JSRuntime.InvokeAsync<object>("saveFile", header.filename + ".txt", txt);
    }
    public async void CtrlC()
    {
        await JSRuntime.InvokeVoidAsync("navigator.clipboard.writeText", txt);

    }
}
```

In [wwwroot/index.html](wwwroot/index.html) has changes for UI and hosting. Additional scripts saveFiles.js. When hosting use correct folder e.g. ```<base href="/blazor/edf/" />```.
```
<style>
    body {
        overscroll-behavior: none;
    }

</style>
...
 <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimum-scale=1, height=device-height" />
...
<base href="/" />
...
<script src="saveFile.js"></script>
<script src="_framework/blazor.webassembly.js"></script>
```
and in service-worker.published.js for PWA. See https://docs.microsoft.com/en-us/aspnet/core/blazor/host-and-deploy/webassembly?view=aspnetcore-5.0#disable-integrity-checking-for-pwas.
```
.map(asset => new Request(asset.url));
```

